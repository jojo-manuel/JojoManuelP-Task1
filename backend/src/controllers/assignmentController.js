const { query, queryOne, getLocalStore, USE_POSTGRES } = require('../config/db');

/**
 * Get assignments list
 * - Admin sees all assignments
 * - Student sees assignments targeted to 'ALL' or specifically targeted to their group
 */
async function getAllAssignments(req, res) {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole === 'ADMIN') {
      let assignments = [];
      if (USE_POSTGRES) {
        assignments = await query(
          `SELECT a.*, u.name as creator_name 
           FROM assignments a 
           LEFT JOIN users u ON a.created_by = u.id 
           ORDER BY a.created_at DESC`
        );
      } else {
        const store = getLocalStore();
        assignments = store.assignments.map(a => {
          const creator = store.users.find(u => u.id === a.created_by);
          const targetGroups = store.assignment_target_groups.filter(atg => atg.assignment_id === a.id).map(atg => atg.group_id);
          return {
            ...a,
            creator_name: creator ? creator.name : 'Professor',
            target_group_ids: targetGroups
          };
        });
      }

      // Attach targeted groups for Admin view
      for (const a of assignments) {
        if (!a.target_group_ids) {
          const targets = await query(`SELECT group_id FROM assignment_target_groups WHERE assignment_id = $1`, [a.id]);
          a.target_group_ids = targets.map(t => t.group_id);
        }
      }

      return res.json({ assignments });
    } else {
      // Student View
      let studentGroupId = null;
      if (USE_POSTGRES) {
        const gm = await queryOne(`SELECT group_id FROM group_members WHERE user_id = $1`, [userId]);
        if (gm) studentGroupId = gm.group_id;
      } else {
        const store = getLocalStore();
        const gm = store.group_members.find(m => m.user_id === userId);
        if (gm) studentGroupId = gm.group_id;
      }

      let assignments = [];
      if (USE_POSTGRES) {
        assignments = await query(
          `SELECT a.*, u.name as creator_name 
           FROM assignments a 
           LEFT JOIN users u ON a.created_by = u.id 
           WHERE a.target_type = 'ALL' 
              OR a.id IN (SELECT assignment_id FROM assignment_target_groups WHERE group_id = $1)
           ORDER BY a.due_date ASC`,
          [studentGroupId || '']
        );
      } else {
        const store = getLocalStore();
        const targetedAsgIds = store.assignment_target_groups
          .filter(atg => atg.group_id === studentGroupId)
          .map(atg => atg.assignment_id);

        assignments = store.assignments
          .filter(a => a.target_type === 'ALL' || (studentGroupId && targetedAsgIds.includes(a.id)))
          .map(a => {
            const creator = store.users.find(u => u.id === a.created_by);
            return {
              ...a,
              creator_name: creator ? creator.name : 'Professor'
            };
          });
      }

      // Check submission status for student's group
      for (const a of assignments) {
        if (studentGroupId) {
          const sub = await queryOne(
            `SELECT * FROM submissions WHERE assignment_id = $1 AND group_id = $2`,
            [a.id, studentGroupId]
          );
          a.submission = sub ? {
            confirmed: true,
            submitted_at: sub.submitted_at,
            notes: sub.notes
          } : null;
        } else {
          a.submission = null;
        }
      }

      return res.json({ assignments, studentGroupId });
    }
  } catch (error) {
    console.error('[GET ASSIGNMENTS ERROR]', error);
    return res.status(500).json({ error: 'Failed to fetch assignments' });
  }
}

/**
 * Create Assignment (Admin only)
 */
async function createAssignment(req, res) {
  try {
    const { title, description, due_date, onedrive_link, target_type = 'ALL', target_group_ids = [] } = req.body;
    const adminId = req.user.id;

    if (!title || !due_date || !onedrive_link) {
      return res.status(400).json({ error: 'Title, due date, and OneDrive link are required' });
    }

    const assignmentId = `asg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await query(
      `INSERT INTO assignments (id, title, description, due_date, onedrive_link, target_type, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [assignmentId, title, description || '', due_date, onedrive_link, target_type, adminId]
    );

    // Insert targeted groups if SPECIFIC_GROUPS
    if (target_type === 'SPECIFIC_GROUPS' && Array.isArray(target_group_ids)) {
      for (const gid of target_group_ids) {
        const atgId = `atg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await query(
          `INSERT INTO assignment_target_groups (id, assignment_id, group_id) VALUES ($1, $2, $3)`,
          [atgId, assignmentId, gid]
        );
      }
    }

    return res.status(201).json({
      message: 'Assignment created successfully',
      assignment: {
        id: assignmentId,
        title,
        description,
        due_date,
        onedrive_link,
        target_type,
        target_group_ids
      }
    });
  } catch (error) {
    console.error('[CREATE ASSIGNMENT ERROR]', error);
    return res.status(500).json({ error: 'Failed to create assignment' });
  }
}

/**
 * Edit Assignment (Admin only)
 */
async function updateAssignment(req, res) {
  try {
    const { id } = req.params;
    const { title, description, due_date, onedrive_link, target_type = 'ALL', target_group_ids = [] } = req.body;

    const assignment = await queryOne(`SELECT * FROM assignments WHERE id = $1`, [id]);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await query(
      `UPDATE assignments SET title = $1, description = $2, due_date = $3, onedrive_link = $4, target_type = $5 WHERE id = $6`,
      [title, description || '', due_date, onedrive_link, target_type, id]
    );

    // Update target groups
    await query(`DELETE FROM assignment_target_groups WHERE assignment_id = $1`, [id]);

    if (target_type === 'SPECIFIC_GROUPS' && Array.isArray(target_group_ids)) {
      for (const gid of target_group_ids) {
        const atgId = `atg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await query(
          `INSERT INTO assignment_target_groups (id, assignment_id, group_id) VALUES ($1, $2, $3)`,
          [atgId, id, gid]
        );
      }
    }

    return res.json({ message: 'Assignment updated successfully' });
  } catch (error) {
    console.error('[UPDATE ASSIGNMENT ERROR]', error);
    return res.status(500).json({ error: 'Failed to update assignment' });
  }
}

/**
 * Delete Assignment (Admin only)
 */
async function deleteAssignment(req, res) {
  try {
    const { id } = req.params;

    const assignment = await queryOne(`SELECT * FROM assignments WHERE id = $1`, [id]);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await query(`DELETE FROM assignments WHERE id = $1`, [id]);

    return res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('[DELETE ASSIGNMENT ERROR]', error);
    return res.status(500).json({ error: 'Failed to delete assignment' });
  }
}

module.exports = {
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment
};
