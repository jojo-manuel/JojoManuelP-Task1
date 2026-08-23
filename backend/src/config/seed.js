const bcrypt = require('bcryptjs');
const { query, queryOne, USE_POSTGRES } = require('./db');

async function seedDatabase() {
  console.log('[SEED] Initializing database schema...');

  // Create DDL schema
  if (USE_POSTGRES) {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(120) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'ADMIN')),
        student_id VARCHAR(50) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS groups (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE,
        created_by VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS group_members (
        id VARCHAR(64) PRIMARY KEY,
        group_id VARCHAR(64) REFERENCES groups(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS assignments (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        due_date TIMESTAMP NOT NULL,
        onedrive_link TEXT NOT NULL,
        target_type VARCHAR(20) DEFAULT 'ALL' CHECK (target_type IN ('ALL', 'SPECIFIC_GROUPS')),
        created_by VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assignment_target_groups (
        id VARCHAR(64) PRIMARY KEY,
        assignment_id VARCHAR(64) REFERENCES assignments(id) ON DELETE CASCADE,
        group_id VARCHAR(64) REFERENCES groups(id) ON DELETE CASCADE,
        UNIQUE(assignment_id, group_id)
      );

      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR(64) PRIMARY KEY,
        assignment_id VARCHAR(64) REFERENCES assignments(id) ON DELETE CASCADE,
        group_id VARCHAR(64) REFERENCES groups(id) ON DELETE CASCADE,
        submitted_by VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        confirmed BOOLEAN DEFAULT TRUE,
        notes TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(assignment_id, group_id)
      );
    `);
  } else {
    console.log('[SEED] Running local store DDL initialization...');
    await query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY);`);
  }

  // Check if users already exist
  const existingUsers = await query(`SELECT COUNT(*) as count FROM users`);
  const userCount = parseInt(existingUsers[0]?.count || 0);

  if (userCount === 0) {
    console.log('[SEED] Seeding initial users, groups, and assignments...');

    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // 1. Users
    const users = [
      { id: 'usr-prof-1', name: 'Prof. Alan Smith', email: 'prof.smith@joineazy.edu', password: defaultPasswordHash, role: 'ADMIN', student_id: null },
      { id: 'usr-prof-2', name: 'Prof. Eleanor Vance', email: 'prof.vance@joineazy.edu', password: defaultPasswordHash, role: 'ADMIN', student_id: null },
      { id: 'usr-stu-1', name: 'Alex Johnson', email: 'alex.johnson@joineazy.edu', password: defaultPasswordHash, role: 'STUDENT', student_id: 'STU1001' },
      { id: 'usr-stu-2', name: 'Sarah Connor', email: 'sarah.connor@joineazy.edu', password: defaultPasswordHash, role: 'STUDENT', student_id: 'STU1002' },
      { id: 'usr-stu-3', name: 'David Kim', email: 'david.kim@joineazy.edu', password: defaultPasswordHash, role: 'STUDENT', student_id: 'STU1003' },
      { id: 'usr-stu-4', name: 'Emily Davis', email: 'emily.davis@joineazy.edu', password: defaultPasswordHash, role: 'STUDENT', student_id: 'STU1004' },
      { id: 'usr-stu-5', name: 'Michael Brown', email: 'michael.brown@joineazy.edu', password: defaultPasswordHash, role: 'STUDENT', student_id: 'STU1005' },
      { id: 'usr-stu-6', name: 'Jessica Taylor', email: 'jessica.taylor@joineazy.edu', password: defaultPasswordHash, role: 'STUDENT', student_id: 'STU1006' }
    ];

    for (const u of users) {
      await query(
        `INSERT INTO users (id, name, email, password, role, student_id) VALUES ($1, $2, $3, $4, $5, $6)`,
        [u.id, u.name, u.email, u.password, u.role, u.student_id]
      );
    }

    // 2. Groups
    const groups = [
      { id: 'grp-1', name: 'Team CyberPulse', code: 'GRP-CYBER', created_by: 'usr-stu-1' },
      { id: 'grp-2', name: 'Data Dynamics', code: 'GRP-DATA', created_by: 'usr-stu-3' },
      { id: 'grp-3', name: 'Neural Coders', code: 'GRP-NEURAL', created_by: 'usr-stu-5' }
    ];

    for (const g of groups) {
      await query(
        `INSERT INTO groups (id, name, code, created_by) VALUES ($1, $2, $3, $4)`,
        [g.id, g.name, g.code, g.created_by]
      );
    }

    // 3. Group Members
    const members = [
      // Team CyberPulse: Alex, Sarah
      { id: 'gm-1', group_id: 'grp-1', user_id: 'usr-stu-1' },
      { id: 'gm-2', group_id: 'grp-1', user_id: 'usr-stu-2' },
      // Data Dynamics: David, Emily
      { id: 'gm-3', group_id: 'grp-2', user_id: 'usr-stu-3' },
      { id: 'gm-4', group_id: 'grp-2', user_id: 'usr-stu-4' },
      // Neural Coders: Michael, Jessica
      { id: 'gm-5', group_id: 'grp-3', user_id: 'usr-stu-5' },
      { id: 'gm-6', group_id: 'grp-3', user_id: 'usr-stu-6' }
    ];

    for (const m of members) {
      await query(
        `INSERT INTO group_members (id, group_id, user_id) VALUES ($1, $2, $3)`,
        [m.id, m.group_id, m.user_id]
      );
    }

    // 4. Assignments
    const now = new Date();
    const futureDate1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const futureDate2 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const assignments = [
      {
        id: 'asg-1',
        title: 'Assignment 1: Distributed Systems Architecture Design',
        description: 'Design a microservice architecture for scalable group submission systems. Upload your architectural diagram PDF and report to OneDrive.',
        due_date: futureDate1,
        onedrive_link: 'https://onedrive.live.com/share?id=Joineazy_Assignment_1_Folder',
        target_type: 'ALL',
        created_by: 'usr-prof-1'
      },
      {
        id: 'asg-2',
        title: 'Assignment 2: Full-Stack React & Node Integration',
        description: 'Develop a responsive role-based frontend with Express API backend. Submit source code zip file via OneDrive.',
        due_date: futureDate2,
        onedrive_link: 'https://onedrive.live.com/share?id=Joineazy_Assignment_2_Folder',
        target_type: 'ALL',
        created_by: 'usr-prof-1'
      },
      {
        id: 'asg-3',
        title: 'Special Research Lab: High-Performance Database Indexing',
        description: 'Benchmark PostgreSQL vs SQLite indexing performance for concurrent group data. Scoped specifically for Team CyberPulse & Data Dynamics.',
        due_date: pastDate,
        onedrive_link: 'https://onedrive.live.com/share?id=Joineazy_Special_Lab_Folder',
        target_type: 'SPECIFIC_GROUPS',
        created_by: 'usr-prof-2'
      }
    ];

    for (const a of assignments) {
      await query(
        `INSERT INTO assignments (id, title, description, due_date, onedrive_link, target_type, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [a.id, a.title, a.description, a.due_date, a.onedrive_link, a.target_type, a.created_by]
      );
    }

    // Target specific groups for asg-3
    await query(`INSERT INTO assignment_target_groups (id, assignment_id, group_id) VALUES ($1, $2, $3)`, ['atg-1', 'asg-3', 'grp-1']);
    await query(`INSERT INTO assignment_target_groups (id, assignment_id, group_id) VALUES ($1, $2, $3)`, ['atg-2', 'asg-3', 'grp-2']);

    // 5. Initial Submissions
    // Team CyberPulse confirmed Assignment 1
    await query(
      `INSERT INTO submissions (id, assignment_id, group_id, submitted_by, confirmed, notes, submitted_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['sub-1', 'asg-1', 'grp-1', 'usr-stu-1', 1, 'Confirmed external OneDrive upload by Alex Johnson.', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()]
    );
    // Data Dynamics confirmed Assignment 3
    await query(
      `INSERT INTO submissions (id, assignment_id, group_id, submitted_by, confirmed, notes, submitted_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['sub-2', 'asg-3', 'grp-2', 'usr-stu-3', 1, 'Confirmed external OneDrive submission by David Kim.', new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()]
    );

    console.log('[SEED] Database seeded successfully with default sample data.');
  } else {
    console.log('[SEED] Database already populated. Skipping initial seed.');
  }
}

module.exports = seedDatabase;

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED ERROR]', err);
      process.exit(1);
    });
}
