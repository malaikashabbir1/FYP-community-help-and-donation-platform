// _______________ Donor Dashboard ____________________

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');

router.get('/dashboard', authenticateToken, authorizeRole('donor'), (req, res) => {
    res.render('donor/donorDashboard');
});

module.exports = router;
