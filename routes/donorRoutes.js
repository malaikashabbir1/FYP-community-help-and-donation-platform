const express = require('express');
const router = express.Router();

const donorController = require('../controllers/donorController');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');


// ===============================
// DONOR DASHBOARD
// ===============================
router.get(
  '/dashboard',
  authenticateToken,
  authorizeRole('donor'),
  donorController.getDonorDashboard
);


// ===============================
// DONATION FORM (FOR SPECIFIC CAMPAIGN)
// ===============================
router.get(
  '/donate/:campaignId',
  authenticateToken,
  authorizeRole('donor'),
  donorController.donationForm
);


// ===============================
// SUBMIT DONATION
// ===============================
router.post(
  '/donate',
  authenticateToken,
  authorizeRole('donor'),
  donorController.addDonation
);

module.exports = router;