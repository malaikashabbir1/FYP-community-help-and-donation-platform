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

// Show create campaign page
router.get(
  '/campaigns/create',
  authenticateToken,
  authorizeRole('admin'),
  adminCampaignController.createPage
);

// Handle create campaign
router.post(
  '/campaigns/create',
  authenticateToken,
  authorizeRole('admin'),
  upload.single('image'),
  adminCampaignController.createCampaign
);

// Show Edit Campaign Page 
router.get(
  '/campaigns/edit/:id',
  authenticateToken,
  authorizeRole('admin'),
  adminCampaignController.editPage
);

// Update campaign 
router.post(
  '/campaigns/edit/:id',
  authenticateToken,
  authorizeRole('admin'),
  upload.single('image'),
  adminCampaignController.updateCampaign
);

// delete the campaign
router.post(
  '/campaigns/delete/:id',
  authenticateToken,
  authorizeRole('admin'),
  adminCampaignController.deleteCampaign
);

router.post('/campaign/:id/approve', adminCampaignController.approveCampaign);
router.post('/campaign/:id/complete', adminCampaignController.completeCampaign);

module.exports = router;
