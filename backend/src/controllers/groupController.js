const { query, queryOne, getLocalStore, USE_POSTGRES } = require('../config/db');

/**
 * Create a new group (Student becomes group leader)
 */
async function createGroup(req, res) {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Check if user is already in a group
    let existingMembership = null;
    if (USE_POSTGRES) {
      existingMembership = await queryOne(`SELECT * FROM group_members WHERE user_id = $1`, [userId]);
    } else {
      const store = getLocalStore();
      existingMembership = store.group_members.find(gm => gm.user_id === userId);
    }

    if (existingMembership) {
      return res.status(400).json({ error: 'You are already a member of a group. Leave your current group first.' });
    }

    const groupId = `grp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const groupCode = `GRP-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create group
    await query(
      `INSERT INTO groups (id, name, code, created_by) VALUES ($1, $2, $3, $4)`,
      [groupId, name.trim(), groupCode, userId]
    );

    // Add creator as first group member
    const memberId = `gm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await query(
      `INSERT INTO group_members (id, group_id, user_id) VALUES ($1, $2, $3)`,
      [memberId, groupId, userId]
    );

    return res.status(201).json({
      message: 'Group created successfully',
      group: {
        id: groupId,
        name: name.trim(),
        code: groupCode,
        created_by: userId,
        members: [{ id: userId, name: req.user.name, email: req.user.email, student_id: req.user.student_id }]
      }
    });
  } catch (error) {
    console.error('[CREATE GROUP ERROR]', error);
    return res.status(500).json({ error: 'Failed to create group' });
  }
}

/**
 * Invite / Add a student to my group (by student email or student ID)
 */
async function addMember(req, res) {
  try {
    const { groupId } = req.params;
    const { emailOrStudentId } = req.body;
    const currentUserId = req.user.id;

    if (!emailOrStudentId || emailOrStudentId.trim() === '') {
      return res.status(400).json({ error: 'Student email or Student ID is required' });
    }

    // Verify current user belongs to this group
    let currentMembership = null;
    if (USE_POSTGRES) {
      currentMembership = await queryOne(`SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`, [groupId, currentUserId]);
    } else {
      const store = getLocalStore();
      currentMembership = store.group_members.find(gm => gm.group_id === groupId && gm.user_id === currentUserId);
    }

    if (!currentMembership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Search target student by email or student_id
    const targetQuery = emailOrStudentId.trim().toLowerCase();
    let targetStudent = null;

    if (USE_POSTGRES) {
      targetStudent = await queryOne(
        `SELECT id, name, email, role, student_id FROM users WHERE LOWER(email) = $1 OR LOWER(student_id) = $1`,
        [targetQuery]
      );
    } else {
      const store = getLocalStore();
      targetStudent = store.users.find(u => 
        u.email.toLowerCase() === targetQuery || 
        (u.student_id && u.student_id.toLowerCase() === targetQuery)
      );
    }

    if (!targetStudent || targetStudent.role !== 'STUDENT') {
      return res.status(404).json({ error: 'Student not found with provided email or Student ID' });
    }

    // Check if target student is already in a group
    let targetMembership = null;
    if (USE_POSTGRES) {
      targetMembership = await queryOne(`SELECT * FROM group_members WHERE user_id = $1`, [targetStudent.id]);
    } else {
      const store = getLocalStore();
      targetMembership = store.group_members.find(gm => gm.user_id === targetStudent.id);
    }

    if (targetMembership) {
      return res.status(400).json({ error: `${targetStudent.name} is already a member of another group` });
    }

    // Add student to group
    const memberId = `gm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await query(
      `INSERT INTO group_members (id, group_id, user_id) VALUES ($1, $2, $3)`,
      [memberId, groupId, targetStudent.id]
    );

    return res.status(201).json({
      message: `${targetStudent.name} added to group successfully`,
      member: {
        id: targetStudent.id,
        name: targetStudent.name,
        email: targetStudent.email,
        student_id: targetStudent.student_id
      }
    });
  } catch (error) {
    console.error('[ADD GROUP MEMBER ERROR]', error);
    return res.status(500).json({ error: 'Failed to add group member' });
  }
}

/**
 * Remove member or leave group
 */
async function removeMember(req, res) {
  try {
    const { groupId, userId } = req.params;
    const currentUserId = req.user.id;

    // Check permissions: either removing self or is group creator
    const group = await queryOne(`SELECT * FROM groups WHERE id = $1`, [groupId]);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (currentUserId !== userId && group.created_by !== currentUserId) {
      return res.status(403).json({ error: 'Only group creator or the member themselves can perform removal' });
    }

    await query(
      `DELETE FROM GROUP_MEMBERS WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );

    return res.json({ message: 'Member removed from group' });
  } catch (error) {
    console.error('[REMOVE GROUP MEMBER ERROR]', error);
    return res.status(500).json({ error: 'Failed to remove member' });
  }
}

/**
 * Get all groups (Admin / Professor overview)
 */
async function getAllGroups(req, res) {
  try {
    if (USE_POSTGRES) {
      const groups = await query(`
        SELECT g.id, g.name, g.code, g.created_at, u.name as creator_name,
               COUNT(gm.user_id) as member_count
        FROM groups g
        LEFT JOIN users u ON g.created_by = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        GROUP BY g.id, g.name, g.code, g.created_at, u.name
        ORDER BY g.created_at DESC
      `);
      return res.json({ groups });
    } else {
      const store = getLocalStore();
      const groups = store.groups.map(g => {
        const creator = store.users.find(u => u.id === g.created_by);
        const memberIds = store.group_members.filter(gm => gm.group_id === g.id).map(gm => gm.user_id);
        const members = store.users.filter(u => memberIds.includes(u.id)).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          student_id: u.student_id
        }));

        return {
          id: g.id,
          name: g.name,
          code: g.code,
          created_at: g.created_at,
          creator_name: creator ? creator.name : 'Unknown',
          member_count: members.length,
          members
        };
      });
      return res.json({ groups });
    }
  } catch (error) {
    console.error('[GET ALL GROUPS ERROR]', error);
    return res.status(500).json({ error: 'Failed to fetch groups' });
  }
}

module.exports = {
  createGroup,
  addMember,
  removeMember,
  getAllGroups
};
