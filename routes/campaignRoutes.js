const express = require('express');
const router = express.Router();

const campaignController = require('../controllers/campaignController');
const authenticateToken = require('../middlewares/authenticateToken');

// LIVE CAMPAIGNS (shared)
router.get(
  '/live',
  authenticateToken,
  campaignController.liveCampaigns
);


// success stories 
router.get('/campaigns/completed',
    authenticateToken,
    campaignController.completedCampaigns);

// ================= CAMPAIGN DETAILS =================
router.get(
  '/:id',
  authenticateToken, // optional but recommended
  campaignController.getCampaignDetails
);




module.exports = router;