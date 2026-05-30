// ________________________ VOLUNTEER ROUTES ____________________________

const express = require('express');
const router = express.Router();

const volunteerController = require('../controllers/volunteerController');
const volunteerCampaignController = require('../controllers/volunteerCampaignController');
const volunteerApplicationController = require('../controllers/volunteerApplicationController');

const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');

const upload = require('../middlewares/upload');
const campaignController = require('../controllers/campaignController');


// ================= DASHBOARD =================
router.get(
  '/dashboard',
  authenticateToken,
  authorizeRole('volunteer'),
  volunteerController.getVolunteerDashboard
);


// ================= CREATE CAMPAIGN =================
router.get(
  '/campaigns/create',
  authenticateToken,
  authorizeRole('volunteer'),
  volunteerCampaignController.createPage
);

router.post(
  '/campaigns/create',
  authenticateToken,
  authorizeRole('volunteer'),
  upload.single('image'),
  volunteerCampaignController.createCampaign
);


// ================= MY CAMPAIGNS =================
router.get(
  '/campaigns/my',
  authenticateToken,
  authorizeRole('volunteer'),
  volunteerCampaignController.myCampaigns
);


// ================= SUBMIT FOR APPROVAL =================
router.post(
  '/campaigns/:id/submit',
  authenticateToken,
  authorizeRole('volunteer'),
  volunteerCampaignController.submitForApproval
);


// ================= EDIT CAMPAIGN =================
router.get(
  '/campaigns/edit/:id',
  authenticateToken,
  authorizeRole('volunteer'),
  volunteerCampaignController.editPage
);

router.post(
  '/campaigns/edit/:id',
  authenticateToken,
  authorizeRole('volunteer'),
  upload.single('image'),
  volunteerCampaignController.updateCampaign
);


// ================= COMPLETED CAMPAIGNS =================
router.get(
  '/campaigns/completed',
  authenticateToken,
  authorizeRole('volunteer'),
  campaignController.completedCampaigns
);


// ================= JOIN CAMPAIGN =================
router.get(
  '/campaigns/:id/join',
  authenticateToken,
  authorizeRole('volunteer'),
  volunteerCampaignController.joinPage
);

router.post(
  '/campaigns/:id/join',
  authenticateToken,
  authorizeRole('volunteer'),
  volunteerCampaignController.joinCampaign
);


// ================= APPLICATIONS =================
router.get(
  '/applications',
  authenticateToken,
  authorizeRole('volunteer'),
  volunteerApplicationController.myApplications
);


module.exports = router;