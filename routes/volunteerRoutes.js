// ________________________ VOLUNTEER DASHBOARD  ____________________________

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');

router.get('/dashboard', authenticateToken, authorizeRole('volunteer'), (req, res) => {
    res.render('volunteer/volunteerDashboard');
});

module.exports = router;
