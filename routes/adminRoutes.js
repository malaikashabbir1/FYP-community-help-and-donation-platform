// _________________ ADMIN DASHBOARD ___________________

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Import your middlewares
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');

// Admin Dashboard route
router.get( '/dashboard',
  authenticateToken,        // Check if user is logged in
  authorizeRole('admin'),   // Check if role is admin
  adminController.getAdminDashboard
);
// GET recent activity JSON
router.get('/recent-activity-json', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const recentActivity = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'name role');
  res.json(recentActivity);
});
module.exports = router;