const Campaign = require('../models/campaign');
const User = require('../models/user');
const Application = require('../models/application');

exports.getVolunteerDashboard = async (req, res) => {
  try {

    // 🔒 Safety check (prevents crash if middleware fails)
    if (!req.user?._id) {
      return res.redirect('/auth/login');
    }

    const userId = req.user._id;

    // ================= PERSONAL CAMPAIGN STATS =================
    const totalCampaigns = await Campaign.countDocuments({ createdBy: userId });

    const drafts = await Campaign.countDocuments({
      createdBy: userId,
      status: 'draft'
    });

    const pending = await Campaign.countDocuments({
      createdBy: userId,
      status: 'pending'
    });

    const active = await Campaign.countDocuments({
      createdBy: userId,
      status: 'active'
    });

    const completed = await Campaign.countDocuments({
      createdBy: userId,
      status: 'completed'
    });

    const joinedCampaigns = await Application.countDocuments({
      user: userId,
      status: "approved"
    });

    // ================= PLATFORM STATS =================
    const liveCampaigns = await Campaign.countDocuments({ status: 'active' });
    const completedCampaigns = await Campaign.countDocuments({ status: 'completed' });
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });

    // ================= RECENT JOINED CAMPAIGNS =================
    const recentJoinedCampaigns = await Application.find({
      user: userId,
      status: "approved"
    })
      .populate("campaign")
      .sort({ createdAt: -1 })
      .limit(5);

    // ================= SAFE USER =================
    const safeUser = {
      _id: req.user._id,
      role: req.user.role,
      name: req.user.name
    };

    // ================= STATS OBJECT =================
    const stats = {
      myStats: {
        totalCampaigns,
        drafts,
        pending,
        active,
        completed,
        joinedCampaigns
      },
      platformStats: {
        liveCampaigns,
        completedCampaigns,
        totalVolunteers
      }
    };

    // ================= RENDER =================
    res.render('volunteer/volunteerDashboard', {
      user: safeUser,
      stats,
      recentJoinedCampaigns
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};