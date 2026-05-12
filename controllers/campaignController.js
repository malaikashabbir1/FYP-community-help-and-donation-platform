const Campaign = require('../models/campaign');

exports.liveCampaigns = async (req, res) => {
  try {

    const campaigns = await Campaign.find({status: 'active' })
      .populate('createdBy', 'name _id')
      .sort({ createdAt: -1 });

    res.render('campaigns/live', {
      user: req.user ? {
        _id: req.user._id,
        role: req.user.role,
        name: req.user.name
      } : null,
      campaigns
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading campaigns');
  }
};

// for showing the completed campaigns
exports.completedCampaigns = async (req, res) => {
  try {

    const campaigns = await Campaign.find({ status: 'completed' })
      .populate('createdBy', 'name _id')
      .sort({ createdAt: -1 });

    res.render('campaigns/completed', {
      user: req.user ? {
        _id: req.user._id,
        role: req.user.role,
        name: req.user.name
      } : null,
      campaigns
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading completed campaigns');
  }
};

// ________________ Campaigns Details ______________

exports.getCampaignDetails = async (req, res) => {
  try {

    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('volunteers', 'name email');

    if (!campaign) {
      return res.status(404).send('Campaign not found');
    }

   

    res.render('campaigns/details', {
      user: req.user,
      campaign
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading campaign details');
  }
};