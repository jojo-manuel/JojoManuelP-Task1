const express = require('express');
const { confirmSubmission, getAdminOverview, getAnalytics } = require('../controllers/submissionController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// 2-step verification confirm (Student)
router.post('/confirm', authenticateToken, requireRole('STUDENT'), confirmSubmission);

// Admin monitoring & analytics
router.get('/overview', authenticateToken, requireRole('ADMIN'), getAdminOverview);
router.get('/analytics', authenticateToken, requireRole('ADMIN'), getAnalytics);

module.exports = router;
