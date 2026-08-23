const express = require('express');
const { searchStudents } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/students', authenticateToken, searchStudents);

module.exports = router;
