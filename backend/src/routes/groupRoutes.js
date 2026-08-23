const express = require('express');
const { createGroup, addMember, removeMember, getAllGroups } = require('../controllers/groupController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Student group endpoints
router.post('/', authenticateToken, requireRole('STUDENT'), createGroup);
router.post('/:groupId/members', authenticateToken, requireRole('STUDENT'), addMember);
router.delete('/:groupId/members/:userId', authenticateToken, requireRole('STUDENT'), removeMember);

// Admin endpoints
router.get('/', authenticateToken, getAllGroups);

module.exports = router;
