const express = require('express');
const { signup } = require('../../controllers/authController');
const User = require('../../models/User');

const router = express.Router();

// API route → handles signup (JSON response)
router.post('/register', signup);

// API route → fetch all users (for testing)
router.get('/all-users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error('Error fetching all users:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
