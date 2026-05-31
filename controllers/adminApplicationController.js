const Application = require('../models/application');
const { checkAndCompleteCampaign } = require('../services/campaignService');
const { setMessage } = require('../utils/flashMessage');
const logActivity = require('../utils/logActivity');

// 🔔 FIXED IMPORT
const { notifyUser } = require('../utils/notify');


// ================= GET ALL APPLICATIONS =================
exports.getAllApplications = async (req, res) => {
  try {

    const { status = "all" } = req.query;

    let filter = {};
    if (status !== "all") {
      filter.status = status;
    }

    // ===================== STATS =====================
    const totalApplications = await Application.countDocuments();
    const pendingCount = await Application.countDocuments({ status: "pending" });
    const approvedCount = await Application.countDocuments({ status: "approved" });
    const rejectedCount = await Application.countDocuments({ status: "rejected" });

    // ===================== APPLICATIONS =====================
    const applications = await Application.find(filter)
      .populate("user", "name email")
      .populate("campaign", "name location requiredVolunteers")
      .sort({ createdAt: -1 });

    // ===================== CAPACITY MAP (IMPORTANT) =====================
    const campaignIds = applications
      .map(app => app.campaign?._id)
      .filter(Boolean);

    const approvedApplications = await Application.find({
      status: "approved",
      campaign: { $in: campaignIds }
    }).lean();

    const approvedCountMap = {};

    approvedApplications.forEach(app => {
      const id = app.campaign.toString();
      approvedCountMap[id] = (approvedCountMap[id] || 0) + 1;
    });

    // ===================== RENDER =====================
    return res.render("admin/applications/list", {
      applications,
      status,
      totalApplications,
      pendingCount,
      approvedCount,
      rejectedCount,
      approvedCountMap 
    });

  } catch (err) {
    console.error("Get Applications Error:", err);
    return res.status(500).send("Error fetching applications");
  }
};

// ================= APPROVE APPLICATION =================
exports.approveApplication = async (req, res) => {
  try {

    const application = await Application.findById(req.params.id)
      .populate("campaign")
      .populate("user", "_id name email");

    if (!application) {
      setMessage(req, "error", "Application not found");
      return res.redirect("/admin/applications");
    }

    // 🚨 CHECK CAMPAIGN LIMIT BEFORE APPROVAL
    const approvedCount = await Application.countDocuments({
      campaign: application.campaign._id,
      status: "approved"
    });

    const required = application.campaign.requiredVolunteers || 0;

    if (approvedCount >= required) {

      setMessage(req, "error", "Cannot approve. Campaign volunteer requirement is already fulfilled.");

      // OPTIONAL: auto mark as rejected or keep pending
      application.status = "rejected";
      await application.save();

      return res.redirect("/admin/applications");
    }

    // ✅ APPROVE
    application.status = "approved";
    await application.save();

    await checkAndCompleteCampaign(application.campaign);

    await logActivity({
      type: "application",
      refId: application._id,
      userId: application.user,
      description: `Application approved: ${application.user.name} joined "${application.campaign.name}"`
    });

    const userId = application.user?._id || application.user;

    if (userId && application.campaign) {
      await notifyUser(
        userId,
        `Your application for "${application.campaign.name}" was approved`,
        `/campaign/${application.campaign._id}`,
        "success"
      );
    }

    setMessage(req, "success", "Application approved successfully");
    return res.redirect("/admin/applications");

  } catch (err) {
    console.error("Approve Error:", err);
    setMessage(req, "error", "Error approving application");
    return res.redirect("/admin/applications");
  }
};

// ================= REJECT APPLICATION =================
exports.rejectApplication = async (req, res) => {
  try {

    const application = await Application.findById(req.params.id)
      .populate("campaign")
      .populate("user", "_id name email");

    if (!application) {
      setMessage(req, "error", "Application not found");
      return res.redirect("/admin/applications");
    }

    application.status = "rejected";
    await application.save();

    const userId = application.user?._id || application.user;

    
    await logActivity({
      type: "application",
      refId: application._id,
      userId: application.user,
      description: `${application.user.name} was rejected for "${application.campaign.name}"`
    });

    // 🔔 FIXED NOTIFICATION
    if (userId && application.campaign) {
      await notifyUser(
        userId,
        `Your application for "${application.campaign.name}" was rejected`,
        `/campaign/${application.campaign._id}`,
        "error"
      );
    }

    setMessage(req, "success", "Application rejected successfully");
    return res.redirect("/admin/applications");

  } catch (err) {
    console.error("Reject Error:", err);
    setMessage(req, "error", "Error rejecting application");
    return res.redirect("/admin/applications");
  }
};