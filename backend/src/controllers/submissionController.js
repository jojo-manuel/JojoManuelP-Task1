const { query, queryOne, getLocalStore, USE_POSTGRES } = require('../config/db');

/**
 * Confirm Assignment Submission (2-step verification)
 * Step 1: Student opens OneDrive link
 * Step 2: Student confirms submission with declaration
 */
async function confirmSubmission(req, res) {
  try {
    const { assignmentId, notes = '' } = req.body;
    const userId = req.user.id;

    if (!assignmentId) {
      return res.status(400).json({ error: 'Assignment ID is required' });
    }

    // 1. Verify student belongs to a group
    let userGroup = null;
    if (USE_POSTGRES) {
      userGroup = await queryOne(`SELECT group_id FROM group_members WHERE user_id = $1`, [userId]);
    } else {
      const store = getLocalStore();
      userGroup = store.group_members.find(gm => gm.user_id === userId);
    }

    if (!userGroup) {
      return res.status(400).json({ error: 'You must form or join a group before confirming assignment submission' });
    }

    const groupId = userGroup.group_id;

    // 2. Check assignment exists
    const assignment = await queryOne(`SELECT * FROM assignments WHERE id = $1`, [assignmentId]);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // 3. Confirm / Upsert submission
    const subId = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowIso = new Date().toISOString();

    await query(
      `INSERT INTO submissions (id, assignment_id, group_id, submitted_by, confirmed, notes, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [subId, assignmentId, groupId, userId, 1, notes.trim(), nowIso]
    );

    return res.status(200).json({
      message: 'Submission confirmed successfully!',
      submission: {
        id: subId,
        assignment_id: assignmentId,
        group_id: groupId,
        submitted_by: userId,
        confirmed: true,
        submitted_at: nowIso,
        notes: notes.trim()
      }
    });
  } catch (error) {
    console.error('[CONFIRM SUBMISSION ERROR]', error);
    return res.status(500).json({ error: 'Failed to confirm submission' });
  }
}

/**
 * Admin Overview: Group-wise and Student-wise submission tracking
 */
async function getAdminOverview(req, res) {
  try {
    let groups = [];
    let assignments = [];
    let submissions = [];

    if (USE_POSTGRES) {
      groups = await query(`SELECT g.id, g.name, g.code FROM groups g ORDER BY g.name ASC`);
      assignments = await query(`SELECT a.id, a.title, a.due_date, a.target_type FROM assignments a ORDER BY a.due_date ASC`);
      submissions = await query(`
        SELECT s.*, u.name as submitter_name, g.name as group_name, a.title as assignment_title
        FROM submissions s
        JOIN users u ON s.submitted_by = u.id
        JOIN groups g ON s.group_id = g.id
        JOIN assignments a ON s.assignment_id = a.id
      `);
    } else {
      const store = getLocalStore();
      groups = store.groups.map(g => ({ id: g.id, name: g.name, code: g.code }));
      assignments = store.assignments.map(a => ({ id: a.id, title: a.title, due_date: a.due_date, target_type: a.target_type }));
      submissions = store.submissions.map(s => {
        const u = store.users.find(usr => usr.id === s.submitted_by);
        const g = store.groups.find(grp => grp.id === s.group_id);
        const a = store.assignments.find(asg => asg.id === s.assignment_id);
        return {
          ...s,
          submitter_name: u ? u.name : 'Student',
          group_name: g ? g.name : 'Unknown Group',
          assignment_title: a ? a.title : 'Assignment'
        };
      });
    }

    // Attach group members for details
    const store = getLocalStore();
    for (const g of groups) {
      if (USE_POSTGRES) {
        g.members = await query(
          `SELECT u.id, u.name, u.email, u.student_id 
           FROM group_members gm 
           JOIN users u ON gm.user_id = u.id 
           WHERE gm.group_id = $1`,
          [g.id]
        );
      } else {
        const mIds = store.group_members.filter(gm => gm.group_id === g.id).map(gm => gm.user_id);
        g.members = store.users.filter(u => mIds.includes(u.id)).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          student_id: u.student_id
        }));
      }
    }

    return res.json({
      groups,
      assignments,
      submissions
    });
  } catch (error) {
    console.error('[GET ADMIN OVERVIEW ERROR]', error);
    return res.status(500).json({ error: 'Failed to fetch admin overview' });
  }
}

/**
 * Analytics Dashboard for Professors
 */
async function getAnalytics(req, res) {
  try {
    const store = getLocalStore();

    let totalStudents = 0;
    let totalGroups = 0;
    let totalAssignments = 0;
    let totalSubmissions = 0;
    let assignmentMetrics = [];
    let groupPerformance = [];

    if (USE_POSTGRES) {
      const studentRes = await query(`SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'`);
      totalStudents = parseInt(studentRes[0]?.count || 0);

      const groupRes = await query(`SELECT COUNT(*) as count FROM groups`);
      totalGroups = parseInt(groupRes[0]?.count || 0);

      const asgRes = await query(`SELECT COUNT(*) as count FROM assignments`);
      totalAssignments = parseInt(asgRes[0]?.count || 0);

      const subRes = await query(`SELECT COUNT(*) as count FROM submissions`);
      totalSubmissions = parseInt(subRes[0]?.count || 0);
    } else {
      totalStudents = store.users.filter(u => u.role === 'STUDENT').length;
      totalGroups = store.groups.length;
      totalAssignments = store.assignments.length;
      totalSubmissions = store.submissions.length;
    }

    // Assignment wise metrics
    const assignmentsList = USE_POSTGRES ? await query(`SELECT id, title, due_date FROM assignments`) : store.assignments;
    const submissionsList = USE_POSTGRES ? await query(`SELECT * FROM submissions`) : store.submissions;

    assignmentMetrics = assignmentsList.map(a => {
      const confirmedCount = submissionsList.filter(s => s.assignment_id === a.id && s.confirmed).length;
      const expectedTotal = totalGroups || 1;
      const rate = Math.round((confirmedCount / expectedTotal) * 100);

      return {
        id: a.id,
        title: a.title,
        due_date: a.due_date,
        submittedCount: confirmedCount,
        pendingCount: Math.max(0, expectedTotal - confirmedCount),
        completionRate: Math.min(100, rate)
      };
    });

    // Group performance metrics
    const groupsList = USE_POSTGRES ? await query(`SELECT id, name FROM groups`) : store.groups;

    groupPerformance = groupsList.map(g => {
      const confirmedSubs = submissionsList.filter(s => s.group_id === g.id && s.confirmed).length;
      const rate = totalAssignments > 0 ? Math.round((confirmedSubs / totalAssignments) * 100) : 0;

      return {
        groupId: g.id,
        groupName: g.name,
        submittedCount: confirmedSubs,
        totalAssignments,
        completionRate: rate
      };
    });

    const overallRate = totalGroups > 0 && totalAssignments > 0
      ? Math.round((totalSubmissions / (totalGroups * totalAssignments)) * 100)
      : 0;

    return res.json({
      summary: {
        totalStudents,
        totalGroups,
        totalAssignments,
        totalSubmissions,
        overallCompletionRate: Math.min(100, overallRate)
      },
      assignmentMetrics,
      groupPerformance
    });
  } catch (error) {
    console.error('[GET ANALYTICS ERROR]', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

module.exports = {
  confirmSubmission,
  getAdminOverview,
  getAnalytics
};
