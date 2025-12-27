const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// ---------------- Page Routes ----------------

// Render register page
router.get('/register', (req, res) => {
    res.render('auth/register', { errors: {}, oldInput: {} });
});

// Handle registration form submission
router.post('/register', authController.signup);

// Render login page
router.get('/login', (req, res) => {
    res.render('auth/login', { errors: {}, email: '' });
});

// Handle login with JWT + role-based redirection
router.post('/login', authController.loginUser);

// Dashboard page
router.get('/dashboard', (req, res) => {
    res.render('auth/dashboard');
});

module.exports = router;
