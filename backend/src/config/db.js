const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const USE_POSTGRES = Boolean(process.env.DATABASE_URL || (process.env.PGHOST && process.env.PGDATABASE));

let pgPool = null;
let localStore = {
  users: [],
  groups: [],
  group_members: [],
  assignments: [],
  assignment_target_groups: [],
  submissions: []
};

const JSON_DB_PATH = path.join(__dirname, '../../data_store.json');

if (USE_POSTGRES) {
  const { Pool } = require('pg');
  const connStr = process.env.DATABASE_URL || `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'joineazy_db'}`;
  const isSSL = connStr.includes('sslmode=') || connStr.includes('neon.tech') || process.env.PGSSL === 'true';

  pgPool = new Pool({
    connectionString: connStr,
    ...(isSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });
  console.log('[DB] Connected via PostgreSQL client.');
} else {
  console.log(`[DB] Using zero-config local persistent JSON store (${JSON_DB_PATH}).`);
  if (fs.existsSync(JSON_DB_PATH)) {
    try {
      const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
      localStore = JSON.parse(data);
    } catch (e) {
      console.error('[DB] Error loading local JSON store, initializing fresh store.', e);
    }
  }
}

function saveLocalStore() {
  if (!USE_POSTGRES) {
    try {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(localStore, null, 2), 'utf8');
    } catch (e) {
      console.error('[DB] Failed to persist JSON store:', e);
    }
  }
}

/**
 * Universal query function supporting PostgreSQL and local fallback store.
 */
async function query(sql, params = []) {
  if (USE_POSTGRES) {
    const res = await pgPool.query(sql, params);
    return res.rows;
  }

  const cleanSql = sql.trim();
  const upperSql = cleanSql.toUpperCase();

  // Handle DDL create table
  if (upperSql.startsWith('CREATE TABLE')) {
    return [];
  }

  // Handle SELECT COUNT(*)
  if (upperSql.startsWith('SELECT COUNT(*)')) {
    const tableMatch = cleanSql.match(/FROM\s+(\w+)/i);
    const tableName = tableMatch ? tableMatch[1].toLowerCase() : null;
    if (tableName && localStore[tableName]) {
      return [{ count: localStore[tableName].length }];
    }
    return [{ count: 0 }];
  }

  // 1. SELECT Users
  if (upperSql.includes('FROM USERS')) {
    let list = [...localStore.users];
    if (upperSql.includes('WHERE EMAIL = $1')) {
      list = list.filter(u => u.email.toLowerCase() === (params[0] || '').toLowerCase());
    } else if (upperSql.includes('WHERE STUDENT_ID = $1')) {
      list = list.filter(u => u.student_id === params[0]);
    } else if (upperSql.includes('WHERE ID = $1')) {
      list = list.filter(u => u.id === params[0]);
    } else if (upperSql.includes("ROLE = 'STUDENT'") || upperSql.includes("ROLE = $1")) {
      const role = upperSql.includes("ROLE = 'STUDENT'") ? 'STUDENT' : params[0];
      list = list.filter(u => u.role === role);
      if (params.length > 1 && params[1]) { // Search query
        const q = params[1].toLowerCase();
        list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.student_id && u.student_id.toLowerCase().includes(q)));
      }
    }
    return list;
  }

  // 2. INSERT INTO users
  if (upperSql.startsWith('INSERT INTO USERS')) {
    const newUser = {
      id: params[0],
      name: params[1],
      email: params[2],
      password: params[3],
      role: params[4],
      student_id: params[5] || null,
      created_at: new Date().toISOString()
    };
    localStore.users.push(newUser);
    saveLocalStore();
    return [newUser];
  }

  // 3. SELECT Groups & Group Members
  if (upperSql.includes('FROM GROUPS')) {
    let list = [...localStore.groups];
    if (upperSql.includes('WHERE ID = $1')) {
      list = list.filter(g => g.id === params[0]);
    } else if (upperSql.includes('WHERE CREATED_BY = $1')) {
      list = list.filter(g => g.created_by === params[0]);
    }
    return list;
  }

  if (upperSql.startsWith('INSERT INTO GROUPS')) {
    const newGroup = {
      id: params[0],
      name: params[1],
      code: params[2] || `GRP-${Math.floor(1000 + Math.random() * 9000)}`,
      created_by: params[3],
      created_at: new Date().toISOString()
    };
    localStore.groups.push(newGroup);
    saveLocalStore();
    return [newGroup];
  }

  if (upperSql.includes('FROM GROUP_MEMBERS')) {
    let list = [...localStore.group_members];
    if (upperSql.includes('WHERE USER_ID = $1')) {
      list = list.filter(gm => gm.user_id === params[0]);
    } else if (upperSql.includes('WHERE GROUP_ID = $1')) {
      list = list.filter(gm => gm.group_id === params[0]);
    }
    return list;
  }

  if (upperSql.startsWith('INSERT INTO GROUP_MEMBERS')) {
    const newMember = {
      id: params[0],
      group_id: params[1],
      user_id: params[2],
      joined_at: new Date().toISOString()
    };
    localStore.group_members.push(newMember);
    saveLocalStore();
    return [newMember];
  }

  if (upperSql.startsWith('DELETE FROM GROUP_MEMBERS')) {
    if (upperSql.includes('GROUP_ID = $1 AND USER_ID = $2')) {
      localStore.group_members = localStore.group_members.filter(gm => !(gm.group_id === params[0] && gm.user_id === params[1]));
    }
    saveLocalStore();
    return [];
  }

  // 4. Assignments & Scoping
  if (upperSql.includes('FROM ASSIGNMENTS')) {
    let list = [...localStore.assignments];
    if (upperSql.includes('WHERE ID = $1')) {
      list = list.filter(a => a.id === params[0]);
    }
    return list;
  }

  if (upperSql.startsWith('INSERT INTO ASSIGNMENTS')) {
    const newAssignment = {
      id: params[0],
      title: params[1],
      description: params[2],
      due_date: params[3],
      onedrive_link: params[4],
      target_type: params[5] || 'ALL',
      created_by: params[6],
      created_at: new Date().toISOString()
    };
    localStore.assignments.push(newAssignment);
    saveLocalStore();
    return [newAssignment];
  }

  if (upperSql.startsWith('UPDATE ASSIGNMENTS')) {
    const assignment = localStore.assignments.find(a => a.id === params[5]);
    if (assignment) {
      assignment.title = params[0];
      assignment.description = params[1];
      assignment.due_date = params[2];
      assignment.onedrive_link = params[3];
      assignment.target_type = params[4];
      saveLocalStore();
      return [assignment];
    }
    return [];
  }

  if (upperSql.startsWith('DELETE FROM ASSIGNMENTS')) {
    localStore.assignments = localStore.assignments.filter(a => a.id !== params[0]);
    localStore.assignment_target_groups = localStore.assignment_target_groups.filter(atg => atg.assignment_id !== params[0]);
    localStore.submissions = localStore.submissions.filter(s => s.assignment_id !== params[0]);
    saveLocalStore();
    return [];
  }

  if (upperSql.includes('FROM ASSIGNMENT_TARGET_GROUPS')) {
    let list = [...localStore.assignment_target_groups];
    if (upperSql.includes('WHERE ASSIGNMENT_ID = $1')) {
      list = list.filter(atg => atg.assignment_id === params[0]);
    }
    return list;
  }

  if (upperSql.startsWith('INSERT INTO ASSIGNMENT_TARGET_GROUPS')) {
    const newATG = {
      id: params[0],
      assignment_id: params[1],
      group_id: params[2]
    };
    localStore.assignment_target_groups.push(newATG);
    saveLocalStore();
    return [newATG];
  }

  if (upperSql.startsWith('DELETE FROM ASSIGNMENT_TARGET_GROUPS')) {
    if (upperSql.includes('WHERE ASSIGNMENT_ID = $1')) {
      localStore.assignment_target_groups = localStore.assignment_target_groups.filter(atg => atg.assignment_id !== params[0]);
      saveLocalStore();
    }
    return [];
  }

  // 5. Submissions
  if (upperSql.includes('FROM SUBMISSIONS')) {
    let list = [...localStore.submissions];
    if (upperSql.includes('WHERE ASSIGNMENT_ID = $1 AND GROUP_ID = $2')) {
      list = list.filter(s => s.assignment_id === params[0] && s.group_id === params[1]);
    } else if (upperSql.includes('WHERE GROUP_ID = $1')) {
      list = list.filter(s => s.group_id === params[0]);
    }
    return list;
  }

  if (upperSql.startsWith('INSERT INTO SUBMISSIONS') || upperSql.includes('ON CONFLICT')) {
    const existingIndex = localStore.submissions.findIndex(s => s.assignment_id === params[1] && s.group_id === params[2]);
    const subObj = {
      id: params[0],
      assignment_id: params[1],
      group_id: params[2],
      submitted_by: params[3],
      confirmed: params[4] !== undefined ? Boolean(params[4]) : true,
      notes: params[5] || '',
      submitted_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      localStore.submissions[existingIndex] = subObj;
    } else {
      localStore.submissions.push(subObj);
    }
    saveLocalStore();
    return [subObj];
  }

  return [];
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

function getLocalStore() {
  return localStore;
}

module.exports = {
  query,
  queryOne,
  USE_POSTGRES,
  getLocalStore
};
