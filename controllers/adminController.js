const User = require('../models/user');
const Campaign = require('../models/campaign');
const ActivityLog = require('../models/activityLog');
const FraudAlert = require("../models/fraudAlert");
const Donation = require("../models/donation");
const Application = require('../models/application');
const fraudService = require("../services/fraudDetectionService");


// ================= ADMIN DASHBOARD =================
exports.getAdminDashboard = async (req, res) => {
  try {

    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const donors = await User.countDocuments({ role: 'donor' });
    const volunteers = await User.countDocuments({ role: 'volunteer' });

    const pendingCampaigns = await Campaign.countDocuments({ status: 'pending' });
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const completedCampaigns = await Campaign.countDocuments({ status: 'completed' });
    const rejectedCampaigns = await Campaign.countDocuments({ status: 'rejected' });

    const categoryStats = await Campaign.aggregate([
      {
        $match: { category: { $ne: null } }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalCampaigns =
      pendingCampaigns +
      activeCampaigns +
      completedCampaigns;

    const pendingApplications = await Application.countDocuments({
      status: "pending"
    });
    const approvedApplications = await Application.countDocuments({ status: "approved" });

    const rejectedApplications = await Application.countDocuments({ status: "rejected" });

    const recentActivity = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name role _id');


   const now = new Date();

// TODAY
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

// LAST 7 DAYS (FIXED)
const startOfWeek = new Date();
startOfWeek.setTime(now.getTime() - 7 * 24 * 60 * 60 * 1000);

// LAST 30 DAYS (FIXED)
const startOfMonth = new Date();
startOfMonth.setTime(now.getTime() - 30 * 24 * 60 * 60 * 1000);


    const usersToday = await User.countDocuments({

      createdAt: { $gte: startOfToday }
    });

    const usersWeek = await User.countDocuments({
      createdAt: { $gte: startOfWeek }
    });

    const usersMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });



    const donationsToday = await Donation.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    const donationsWeek = await Donation.countDocuments({
      createdAt: { $gte: startOfWeek }
    });

    const  donationsMonth = await Donation.countDocuments({
      createdAt: { $gte: startOfMonth }
    });


    const applicationsToday = await Application.countDocuments({
  createdAt: { $gte: startOfToday }
});

const applicationsWeek = await Application.countDocuments({
  createdAt: { $gte: startOfWeek }
});

const applicationsMonth = await Application.countDocuments({
  createdAt: { $gte: startOfMonth }
});

const campaignsToday = await Campaign.countDocuments({
  createdAt: { $gte: startOfToday }
});

const campaignsWeek = await Campaign.countDocuments({
  createdAt: { $gte: startOfWeek }
});

const campaignsMonth = await Campaign.countDocuments({
  createdAt: { $gte: startOfMonth }
});

// top performing campaigns 
const campaignDonationStats = await Donation.aggregate([
  {
    $group: {
      _id: "$campaign",
      totalAmount: { $sum: "$amount" }
    }
  },
  {
    $lookup: {
      from: "campaigns",
      localField: "_id",
      foreignField: "_id",
      as: "campaign"
    }
  },
  {
    $unwind: "$campaign"
  },
  {
    $project: {
      _id: 0,
      campaignName: "$campaign.name",
      totalAmount: 1
    }
  },
  {
    $sort: { totalAmount: -1 }
  }
]);

    res.render('admin/adminDashboard', {
      totalUsers,
      donors,
      volunteers,
      totalCampaigns,
      pendingCampaigns,
      activeCampaigns,
      completedCampaigns,
      rejectedCampaigns,
      pendingApplications,
      approvedApplications, 
      rejectedApplications,
      recentActivity,
      categoryStats,
      usersToday, usersWeek, usersMonth,
      donationsToday, donationsWeek, donationsMonth,
      applicationsToday, applicationsWeek, applicationsMonth,
      campaignsToday, campaignsWeek, campaignsMonth,
      campaignDonationStats,
      user: {
        _id: req.user?._id,   // ✅ SAFE
        role: req.user?.role,
        name: req.user?.name
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};


// ================= GET ALL USERS =================
exports.getAllUsers = async (req, res) => {
  try {

    const { search = '', role = 'all' } = req.query;

    let query = { role: { $ne: 'admin' } };

    if (role !== 'all') {
      query = {
        role,
        role: { $ne: 'admin' }
      };
    }

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

    const users = await User.find(query)
      .sort({ createdAt: -1 });

    const counts = {
      all: await User.countDocuments({ role: { $ne: 'admin' } }),
      donor: await User.countDocuments({ role: 'donor' }),
      volunteer: await User.countDocuments({ role: 'volunteer' })
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


// ================= USER DETAILS =================
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


// ================= TOGGLE USER STATUS =================
exports.toggleUserStatus = async (req, res) => {
  try {

    const user = await User.findById(req.params.id);

    if (!user) return res.redirect('/admin/users');

    if (user.role === 'admin') {
      return res.status(403).send("Admin cannot be changed");
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.redirect('/admin/users');

  } catch (err) {
    console.log(err);
    return res.redirect('/admin/users');
  }
};



// ================= FRAUD ALERTS PAGE =================

exports.getFraudAlerts = async (req, res) => {
  try {

    const alerts = await FraudAlert.find()
      .populate("user", "name email")
      .populate("campaign", "name")
      .sort({ createdAt: -1 });

    return res.render("admin/fraudAlerts", {
      fraudAlerts: alerts,
      message: null,
      query: req.query  
    });

  } catch (err) {
    console.error(err);

    return res.render("admin/fraudAlerts", {
      fraudAlerts: [],
      message: {
        type: "error",
        text: "Failed to load fraud alerts",
      },
      query: req.query  
    });
  }
};

// ================= RUN BATCH FRAUD SCAN =================
exports.runFraudScan = async (req, res) => {
  try {


    await fraudService.runBatchFraudScan(); // 👈 THIS IS CRITICAL

    return res.redirect(
      "/admin/fraud-alerts?status=success&msg=Fraud scan completed successfully"
    );

  } catch (err) {
    console.error(err);

    return res.redirect(
      "/admin/fraud-alerts?status=error&msg=Failed to run fraud scan"
    );
  }
};