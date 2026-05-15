const Campaign = require('../models/campaign');
const Application = require('../models/application');

// ____________________ GET ALL LIVE CAMPAIGNS ________________
exports.liveCampaigns = async (req, res) => {
  try {

    // 1️⃣ Get all active campaigns
    const campaigns = await Campaign.find({ status: 'active' })
      .populate('createdBy', 'name _id')
      .sort({ createdAt: -1 });

    // 2️⃣ Get ALL approved applications (for correct counts)
    const approvedApplications = await Application.find({
      status: 'approved'
    }).lean();

    // 3️⃣ Build approved count map (campaignId -> count)
    const approvedCountMap = {};

    approvedApplications.forEach(app => {
      const campaignId = app.campaign.toString();
      approvedCountMap[campaignId] =
        (approvedCountMap[campaignId] || 0) + 1;
    });

    // 4️⃣ Get current user applications (for UI state)
    let applicationMap = {};

    if (req.user && req.user.role === 'volunteer') {
      const userApplications = await Application.find({
        user: req.user._id
      }).lean();

      userApplications.forEach(app => {
        applicationMap[app.campaign.toString()] = app;
      });
    }

    // 5️⃣ Render view
    return res.render('campaigns/live', {
      user: req.user ? {
        _id: req.user._id,
        role: req.user.role,
        name: req.user.name
      } : null,
      campaigns,
      applicationMap,
      approvedCountMap   // ✅ IMPORTANT
    });

  } catch (err) {
    console.error("Live Campaigns Error:", err);
    return res.status(500).send('Error loading campaigns');
  }
};




// for showing the completed campaigns
exports.completedCampaigns = async (req, res) => {
  try {

    const campaigns = await Campaign.find({ status: 'completed' })
      .populate('createdBy', 'name _id')
      .sort({ createdAt: -1 });

    // 🔥 get approved applications only
    const approvedApps = await Application.find({ status: 'approved' }).lean();

    // 🔥 map: campaignId → count
    const approvedCountMap = {};

    approvedApps.forEach(app => {
      const id = app.campaign.toString();
      approvedCountMap[id] = (approvedCountMap[id] || 0) + 1;
    });

    // 🔥 attach count to each campaign
    const campaignsWithCounts = campaigns.map(c => {
      const obj = c.toObject();
      obj.approvedCount = approvedCountMap[c._id.toString()] || 0;
      return obj;
    });

    res.render('campaigns/completed', {
      user: req.user ? {
        _id: req.user._id,
        role: req.user.role,
        name: req.user.name
      } : null,
      campaigns: campaignsWithCounts
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
      .populate('createdBy', 'name email');

    if (!campaign) {
      return res.status(404).send('Campaign not found');
    }

    // ✅ approved volunteers only (for display)
    const volunteers = await Application.find({
      campaign: req.params.id,
      status: "approved"
    }).populate('user', 'name email');

    // ✅ check if current user already applied
    let existingApplication = null;

    if (req.user) {
      existingApplication = await Application.findOne({
        user: req.user._id,
        campaign: req.params.id
      });
    }

    res.render('campaigns/details', {
      user: req.user,
      campaign,
      volunteers,
      existingApplication   // 🔥 IMPORTANT ADDITION
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading campaign details');
  }
};