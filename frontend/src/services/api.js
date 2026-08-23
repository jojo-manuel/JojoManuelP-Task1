const API_BASE = '/api';

/**
 * Custom fetch wrapper with authorization headers & error handling
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('joineazy_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Users
  searchStudents: (q = '') => request(`/users/students?q=${encodeURIComponent(q)}`),

  // Groups
  createGroup: (payload) => request('/groups', { method: 'POST', body: JSON.stringify(payload) }),
  addMember: (groupId, payload) => request(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify(payload) }),
  removeMember: (groupId, userId) => request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
  getAllGroups: () => request('/groups'),

  // Assignments
  getAssignments: () => request('/assignments'),
  createAssignment: (payload) => request('/assignments', { method: 'POST', body: JSON.stringify(payload) }),
  updateAssignment: (id, payload) => request(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAssignment: (id) => request(`/assignments/${id}`, { method: 'DELETE' }),

  // Submissions & Analytics
  confirmSubmission: (payload) => request('/submissions/confirm', { method: 'POST', body: JSON.stringify(payload) }),
  getAdminOverview: () => request('/submissions/overview'),
  getAnalytics: () => request('/submissions/analytics')
};
