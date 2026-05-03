const Campaign = require('../models/campaign');

// LIVE CAMPAIGNS (Explore Page)
const liveCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'active' })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.render('campaigns/live', {
      user: req.user,
      campaigns
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading campaigns');
  }
};

module.exports = {
  liveCampaigns
};