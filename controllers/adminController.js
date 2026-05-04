const User = require('../models/user');
const Campaign = require('../models/campaign');
const ActivityLog = require('../models/activityLog');

// Admin Dashboard Controller
exports.getAdminDashboard = async (req, res) => {
  try {

    // ================= USER STATS =================
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const donors = await User.countDocuments({ role: 'donor' });
    const volunteers = await User.countDocuments({ role: 'volunteer' });

    // ================= CAMPAIGN STATS =================
    const pendingCampaigns = await Campaign.countDocuments({ status: 'pending' });
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const completedCampaigns = await Campaign.countDocuments({ status: 'completed' });
    const rejectedCampaigns = await Campaign.countDocuments({ status: 'rejected' });

    //  TOTAL = ONLY meaningful campaigns
    const totalCampaigns =
      pendingCampaigns +
      activeCampaigns +
      completedCampaigns;

    // ================= ACTIVITY LOG =================
    const recentActivity = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name role _id');

    // ================= RECENT USERS =================
    const recentUsers = await User.find({ role: { $ne: "admin" } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name role _id createdAt');

    // ================= RENDER =================
    res.render('admin/adminDashboard', {
      totalUsers,
      donors,
      volunteers,
      totalCampaigns,
      pendingCampaigns,
      activeCampaigns,
      completedCampaigns,
      rejectedCampaigns,
      recentActivity,
      recentUsers,
      user: {
        _id: req.user._id,
        role: req.user.role,
        name: req.user.name
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};