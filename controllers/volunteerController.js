const Campaign = require('../models/campaign');
const User = require('../models/user');

exports.getVolunteerDashboard = async (req, res) => {
  try {

    const userId = req.user._id; // ✅ correct `_id` usage

    // ==============================
    // PERSONAL CAMPAIGN STATS
    // ==============================
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

    // ==============================
    // PLATFORM-WIDE STATS
    // ==============================
    const liveCampaigns = await Campaign.countDocuments({ status: 'active' });

    const completedCampaigns = await Campaign.countDocuments({ status: 'completed' });

    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });

    // ==============================
    // SAFE USER OBJECT (EJS FIX)
    // ==============================
    const safeUser = {
      _id: req.user._id,
      role: req.user.role,
      name: req.user.name
    };

    // ==============================
    // STATS OBJECT
    // ==============================
    const stats = {
      myStats: {
        totalCampaigns,
        drafts,
        pending,
        active
      },
      platformStats: {
        liveCampaigns,
        completedCampaigns,
        totalVolunteers
      }
    };

    res.render('volunteer/volunteerDashboard', {
      user: safeUser,
      stats
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};