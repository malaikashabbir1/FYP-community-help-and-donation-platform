const Campaign = require('../models/campaign');
const Application = require('../models/application');
const Donation = require('../models/donation');
const User = require('../models/User');

const {
  getPersonalizedRecommendations,
  getTrendingRecommendations
} = require('../services/recommendationService');

exports.liveCampaigns = async (req, res) => {
  try {

    const campaigns = await Campaign.find({ status: 'active' })
      .populate('createdBy', 'name _id')
      .sort({ createdAt: -1 });

    const approvedApplications = await Application.find({
      status: 'approved'
    }).lean();

    const approvedCountMap = {};

    approvedApplications.forEach(app => {
      if (!app?.campaign) return;

      const id = app.campaign.toString();
      approvedCountMap[id] =
        (approvedCountMap[id] || 0) + 1;
    });

    let applicationMap = {};

    if (req.user?.role === 'volunteer') {
      const userApplications = await Application.find({
        user: req.user._id
      }).lean();

      userApplications.forEach(app => {
        if (!app?.campaign) return;
        applicationMap[app.campaign.toString()] = app;
      });
    }

    let recommended = [];
    let trending = [];

    const user = req.user;

    if (user) {

      const donationsCount = await Donation.countDocuments({
        donor: user._id
      });

      const applicationsCount = await Application.countDocuments({
        user: user._id
      });

      // ✅ FIXED NEW USER LOGIC (NO LOG DEPENDENCY)
      const isNewUser =
        donationsCount === 0 &&
        applicationsCount === 0;

      if (isNewUser) {
        trending = await getTrendingRecommendations();
      } else {
        recommended = await getPersonalizedRecommendations(user);
      }
    }

    return res.render('campaigns/live', {
      user: req.user
        ? {
            _id: req.user._id,
            role: req.user.role,
            name: req.user.name
          }
        : null,

      campaigns,
      applicationMap,
      approvedCountMap,

      recommended,
      trending
    });

  } catch (err) {
    console.error("Live Campaigns Error:", err);
    return res.status(500).send('Error loading campaigns');
  }
};


// __________________ COMPLETED CAMPAIGNS ________________
exports.completedCampaigns = async (req, res) => {
  try {

    const campaigns = await Campaign.find({ status: 'completed' })
      .populate('createdBy', 'name _id')
      .sort({ createdAt: -1 });

    const approvedApps = await Application.find({
      status: 'approved'
    }).lean();

    const approvedCountMap = {};

    approvedApps.forEach(app => {
      if (!app.campaign) return;

      const id = app.campaign.toString();
      approvedCountMap[id] = (approvedCountMap[id] || 0) + 1;
    });

    const campaignsWithCounts = campaigns.map(c => {
      const obj = c.toObject();
      obj.approvedCount =
        approvedCountMap[c._id.toString()] || 0;
      return obj;
    });

    res.render('campaigns/completed', {
      user: req.user
        ? {
            _id: req.user._id,
            role: req.user.role,
            name: req.user.name
          }
        : null,
      campaigns: campaignsWithCounts
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading completed campaigns');
  }
};


// __________________ CAMPAIGN DETAILS ________________
exports.getCampaignDetails = async (req, res) => {
  try {

    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!campaign) {
      return res.status(404).send('Campaign not found');
    }

    const volunteers = await Application.find({
      campaign: req.params.id,
      status: "approved"
    }).populate('user', 'name email');

    let existingApplication = null;

    if (req.user?._id) {
      existingApplication = await Application.findOne({
        user: req.user._id,
        campaign: req.params.id
      });
    }

    // safer defaults
    campaign.category = campaign.category ?? null;
    campaign.subCategory = campaign.subCategory ?? null;
    campaign.urgency = campaign.urgency ?? "medium";

    res.render('campaigns/details', {
      user: req.user || null,
      campaign,
      volunteers: volunteers || [],
      existingApplication
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send('Error loading campaign details');
  }
};