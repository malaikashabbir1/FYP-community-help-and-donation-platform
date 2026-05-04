const Campaign = require('../models/campaign');

// LIVE CAMPAIGNS (Explore Page)
const liveCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'active' })
      .populate('createdBy', 'name _id') // ensure _id consistency
      .sort({ createdAt: -1 });

    res.render('campaigns/live', {
      user: {
        _id: req.user._id,
        role: req.user.role,
        name: req.user.name
      },
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