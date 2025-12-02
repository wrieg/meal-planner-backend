const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, getProfile);

module.exports = router;