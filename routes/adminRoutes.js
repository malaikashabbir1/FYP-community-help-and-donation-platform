// _________________ ADMIN DASHBOARD ___________________

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminCampaignController = require('../controllers/adminCampaignController');
const upload = require('../middlewares/upload');

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

// ================= CAMPAIGNS ROUTES =================

// Show all campaigns
router.get(
  '/campaigns',
  authenticateToken,
  authorizeRole('admin'),
  adminCampaignController.getAllCampaigns
);

// Review Campaign 
router.get(
  '/campaigns/:id/review',
  authenticateToken,
  authorizeRole('admin'),
  adminCampaignController.reviewPage
);

// delete the campaign
router.post(
  '/campaigns/:id/delete',
  authenticateToken,
  authorizeRole('admin'),
  adminCampaignController.deleteCampaign
);

// approve campaign
router.post('/campaigns/:id/approve',
  authenticateToken,
  authorizeRole('admin'),
  adminCampaignController.approveCampaign
);

// complete campaign
router.post('/campaigns/:id/complete',
  authenticateToken,
  authorizeRole('admin'),
  adminCampaignController.completeCampaign
);

// reject campaign
router.post(
  '/campaigns/:id/reject',
  authenticateToken,
  authorizeRole('admin'),
  adminCampaignController.rejectCampaign
);

module.exports = router;
