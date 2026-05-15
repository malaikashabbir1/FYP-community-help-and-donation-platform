// _________________ ADMIN DASHBOARD ___________________

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminCampaignController = require('../controllers/adminCampaignController');
const upload = require('../middlewares/upload');
const campaignController = require('../controllers/campaignController');
const adminDonationController = require('../controllers/adminDonationController');
const adminApplicationController =  require('../controllers/adminApplicationController');


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

// adminRoutes.js __________ nav bar
router.get('/campaigns/list', adminCampaignController.getAllCampaigns);

// success stories
router.get('/campaigns/completed', campaignController.completedCampaigns);



// ______________ Quick Action Donations _________________
router.get(
  '/donations',
  authenticateToken,
  authorizeRole('admin'),
  adminDonationController.getAllDonations
);

// _________ summary  ___________
router.get(
  '/donations/summary',
  authenticateToken,
  authorizeRole('admin'),
  adminDonationController.getDonationSummary
);

router.get(
  '/donations/:id',
  authenticateToken,
  authorizeRole('admin'),
  adminDonationController.getDonationDetails
);
 
// ________________ Manage Users _______________
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);


// ================= APPLICATIONS =================

// view all applications
router.get('/applications', adminApplicationController.getAllApplications);

// approve application
router.post('/applications/approve/:id', adminApplicationController.approveApplication);

// reject application
router.post('/applications/reject/:id', adminApplicationController.rejectApplication);



router.get('/users/toggle/:id', adminController.toggleUserStatus);
module.exports = router;
