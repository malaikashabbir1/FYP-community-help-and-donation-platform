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

module.exports = router;