const { query, getLocalStore, USE_POSTGRES } = require('../config/db');

/**
 * Search students by name, email, or student_id
 */
async function searchStudents(req, res) {
  try {
    const search = req.query.q || '';
    const currentUserId = req.user.id;

    if (USE_POSTGRES) {
      const searchPattern = `%${search}%`;
      const students = await query(
        `SELECT id, name, email, student_id 
         FROM users 
         WHERE role = 'STUDENT' 
           AND id != $1
           AND (LOWER(name) LIKE LOWER($2) OR LOWER(email) LIKE LOWER($2) OR LOWER(student_id) LIKE LOWER($2))
         LIMIT 20`,
        [currentUserId, searchPattern]
      );
      return res.json({ students });
    } else {
      const store = getLocalStore();
      const q = search.toLowerCase();
      
      // Find students who are not the current user
      let students = store.users.filter(u => u.role === 'STUDENT' && u.id !== currentUserId);
      
      if (q) {
        students = students.filter(u => 
          u.name.toLowerCase().includes(q) || 
          u.email.toLowerCase().includes(q) || 
          (u.student_id && u.student_id.toLowerCase().includes(q))
        );
      }

      // Also map group membership status for convenience
      const groupMemberships = store.group_members;
      const groupMap = {};
      groupMemberships.forEach(gm => {
        groupMap[gm.user_id] = gm.group_id;
      });

      const formatted = students.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        student_id: u.student_id,
        groupId: groupMap[u.id] || null
      }));

      return res.json({ students: formatted.slice(0, 20) });
    }
  } catch (error) {
    console.error('[USER SEARCH ERROR]', error);
    return res.status(500).json({ error: 'Failed to search students' });
  }
}

module.exports = {
  searchStudents
};
