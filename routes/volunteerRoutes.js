// ________________________ VOLUNTEER ROUTES ____________________________

const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const volunteerCampaignController = require('../controllers/volunteerCampaignController');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');
const upload = require('../middlewares/upload'); // or your multer config file

// Volunteer Dashboard Route
router.get(
    '/dashboard',
    authenticateToken,
    authorizeRole('volunteer'),
    volunteerController.getVolunteerDashboard
);

// Volunteer Signup / Task Request Route
router.post(
    '/signup',
    authenticateToken,
    authorizeRole('volunteer')
);

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

// for getting the list of my campaigns
router.get(
  '/campaigns/my',
  authenticateToken,
  authorizeRole('volunteer'),
  volunteerCampaignController.myCampaigns
);


router.post(
  '/campaigns/:id/submit',
  authenticateToken,
  authorizeRole('volunteer'),
  volunteerCampaignController.submitForApproval
);

//  Edit Page
router.get(
  '/campaigns/edit/:id',
  authenticateToken,
  authorizeRole('volunteer'),
  volunteerCampaignController.editPage
);

// Update Function
router.post(
  '/campaigns/edit/:id',
  authenticateToken,
  authorizeRole('volunteer'),
  upload.single('image'),
  volunteerCampaignController.updateCampaign
);

router.get('/campaigns/myCampaigns', (req, res) => {
  res.send('Route working');
});

//__________ Nav bar ______________
router.get('/campaigns/create', volunteerCampaignController.createCampaign);
router.get('/campaigns/my', volunteerCampaignController.myCampaigns);



module.exports = router;