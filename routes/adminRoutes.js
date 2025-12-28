// _________________ ADMIN DASHBOARD ___________________

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');

router.get('/dashboard', authenticateToken, authorizeRole('admin'), (req, res) => {
    res.render('admin/adminDashboard');
});

module.exports = router;
