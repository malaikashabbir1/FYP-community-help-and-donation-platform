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



// ______________ Manage Users __________________________
exports.getAllUsers = async (req, res) => {
  try {

    const { search = '', role = 'all' } = req.query;

    // EXCLUDE ADMIN
    let query = {
      role: { $ne: 'admin' }
    };

    // ROLE FILTER
    if (role !== 'all') {
      query.role = role;
    }

    // SEARCH FILTER
    if (search) {

      query.$or = [
        {
          name: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          email: {
            $regex: search,
            $options: 'i'
          }
        }
      ];
    }

    // USERS
    const users = await User.find(query)
      .sort({ createdAt: -1 });

    // COUNTS (WITHOUT ADMIN)
    const counts = {
      all: await User.countDocuments({
        role: { $ne: 'admin' }
      }),

      donor: await User.countDocuments({
        role: 'donor'
      }),

      volunteer: await User.countDocuments({
        role: 'volunteer'
      })
    };

    res.render('admin/users/list', {
      users,
      search,
      role,
      counts
    });

  } catch (err) {
    console.log(err);
    res.send("Error loading users");
  }
};


// GET USER DETAILS
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.redirect('/admin/users');
    }

    res.render('admin/users/details', { user });

  } catch (err) {
    console.log(err);
    res.redirect('/admin/users');
  }
};

// TOGGLE USER STATUS
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.redirect('/admin/users');

    if (user.role === 'admin') {
      return res.status(403).send("Admin cannot be changed");
    }

    user.isActive = !user.isActive;
    await user.save();

    res.redirect('/admin/users');

  } catch (err) {
    console.log(err);
    res.redirect('/admin/users');
  }
};