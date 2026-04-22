const User = require('../models/user');
const Campaign = require('../models/campaign');
const ActivityLog = require('../models/activityLog');

// Controller to render Admin Dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    // USER STATS
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const donors = await User.countDocuments({ role: 'donor' });
    const volunteers = await User.countDocuments({ role: 'volunteer' });

    // CAMPAIGN STATS
    const totalCampaigns = await Campaign.countDocuments();
    const draftCampaigns = await Campaign.countDocuments({ status: 'draft' });
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const completedCampaigns = await Campaign.countDocuments({ status: 'completed' });

    // for Pending Requests 
    const recentActivity = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name role');

    // Recent registrations 
    // storing the recent users in the ARRAY
    const recentUsers = await User
      .find({ role: { $ne: "admin" } })
      .sort({ createdAt: -1 })
      .limit(5);

    
    res.render('admin/adminDashboard', {
      totalUsers,
      donors,
      volunteers,
      totalCampaigns,
      draftCampaigns,
      activeCampaigns,
      completedCampaigns,
      recentActivity,
      recentUsers,
      user: req.user
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};



