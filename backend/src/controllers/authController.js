const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne, getLocalStore, USE_POSTGRES } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * Register user (Student or Admin)
 */
async function register(req, res) {
  try {
    const { name, email, password, role = 'STUDENT', student_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (role === 'STUDENT' && !student_id) {
      return res.status(400).json({ error: 'Student ID is required for student registration' });
    }

    // Check if email already exists
    const existingUser = await queryOne(`SELECT * FROM users WHERE email = $1`, [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check student_id uniqueness if student
    if (role === 'STUDENT' && student_id) {
      const existingStudentId = await queryOne(`SELECT * FROM users WHERE student_id = $1`, [student_id]);
      if (existingStudentId) {
        return res.status(400).json({ error: 'Student ID is already registered' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await query(
      `INSERT INTO users (id, name, email, password, role, student_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, name, email.toLowerCase(), hashedPassword, role, student_id || null]
    );

    const token = jwt.sign(
      { id: userId, email: email.toLowerCase(), name, role, student_id: student_id || null },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: userId, name, email: email.toLowerCase(), role, student_id: student_id || null }
    });
  } catch (error) {
    console.error('[AUTH REGISTER ERROR]', error);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await queryOne(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, student_id: user.student_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        student_id: user.student_id
      }
    });
  } catch (error) {
    console.error('[AUTH LOGIN ERROR]', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
}

/**
 * Get current user profile & group status
 */
async function getMe(req, res) {
  try {
    const userId = req.user.id;
    const user = await queryOne(`SELECT id, name, email, role, student_id, created_at FROM users WHERE id = $1`, [userId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let group = null;
    let groupMembers = [];

    if (user.role === 'STUDENT') {
      let groupMemberRecord = null;
      if (USE_POSTGRES) {
        groupMemberRecord = await queryOne(`SELECT group_id FROM group_members WHERE user_id = $1`, [userId]);
      } else {
        const store = getLocalStore();
        groupMemberRecord = store.group_members.find(gm => gm.user_id === userId);
      }

      if (groupMemberRecord) {
        const groupId = groupMemberRecord.group_id;
        group = await queryOne(`SELECT * FROM groups WHERE id = $1`, [groupId]);

        if (group) {
          if (USE_POSTGRES) {
            groupMembers = await query(
              `SELECT u.id, u.name, u.email, u.student_id, gm.joined_at 
               FROM group_members gm 
               JOIN users u ON gm.user_id = u.id 
               WHERE gm.group_id = $1`,
              [groupId]
            );
          } else {
            const store = getLocalStore();
            const memberIds = store.group_members.filter(gm => gm.group_id === groupId).map(gm => gm.user_id);
            groupMembers = store.users.filter(u => memberIds.includes(u.id)).map(u => ({
              id: u.id,
              name: u.name,
              email: u.email,
              student_id: u.student_id
            }));
          }
        }
      }
    }

    return res.json({
      user,
      group: group ? { ...group, members: groupMembers } : null
    });
  } catch (error) {
    console.error('[AUTH GETME ERROR]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  register,
  login,
  getMe
};
