const express = require('express');
const { getAllAssignments, createAssignment, updateAssignment, deleteAssignment } = require('../controllers/assignmentController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, getAllAssignments);
router.post('/', authenticateToken, requireRole('ADMIN'), createAssignment);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateAssignment);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteAssignment);

module.exports = router;
