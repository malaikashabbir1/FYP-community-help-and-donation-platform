const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { signup } = require('../controllers/authController');
const jwt = require('jsonwebtoken');

const router = express.Router();

// ---------------- Page Routes ----------------

// Render register page
router.get('/register', (req, res) => {
    res.render('auth/register', { errors: {}, oldInput: {} });
});

// Handle registration form submission
router.post('/register', signup);

// Render login page
router.get('/login', (req, res) => {
    res.render('auth/login', { errors: {}, email: '' });
});

// Handle login form submission
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const errors = {};

    try {
        const user = await User.findOne({ email });
        if (!user) {
            errors.email = 'Email not found';
            return res.status(400).render('auth/login', { errors, email });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            errors.password = 'Incorrect password';
            return res.status(400).render('auth/login', { errors, email });
        }

        // Login successful → generate JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET, // use environment variable
            { expiresIn: '1h' }
        );

        // Send token via cookie for page-based auth
        res.cookie('token', token, { httpOnly: true }); // secure: true in production
        res.redirect('/auth/dashboard');

    } catch (err) {
        console.error('Login error:', err);
        errors.general = 'Server error';
        res.status(500).render('auth/login', { errors, email });
    }
});

// Dashboard page
router.get('/dashboard', (req, res) => {
    res.render('auth/dashboard');
});

module.exports = router;
