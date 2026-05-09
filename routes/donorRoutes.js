const express = require('express');
const router = express.Router();

const donorDonationController = require('../controllers/donorDonationController');
const donorController = require('../controllers/donorController');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');
const campaignController = require('../controllers/campaignController');



// DONOR DASHBOARD
router.get(
  '/dashboard',
  authenticateToken,
  authorizeRole('donor'),
  donorController.getDonorDashboard
);


// DONATION FORM (FOR SPECIFIC CAMPAIGN)
router.get(
  '/donate/:campaignId',
  authenticateToken,
  authorizeRole('donor'),
  donorController.donationForm
);


// SUBMIT DONATION
router.post(
  '/donate',
  authenticateToken,
  authorizeRole('donor'),
  donorDonationController.addDonation
);

// success stories 
router.get('/campaigns/completed', campaignController.completedCampaigns);

// MyDonations
router.get('/my-donations', donorDonationController.getMyDonations);
module.exports = router;