const Application = require('../models/Application');
const { checkAndCompleteCampaign } = require('../services/campaignService');
const { setMessage } = require('../utils/flashMessage');


// ================= GET ALL APPLICATIONS (WITH FILTER) =================
exports.getAllApplications = async (req, res) => {
  try {

    const { status = "all" } = req.query;

    let filter = {};

    if (status !== "all") {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate("user", "name email")
      .populate("campaign", "name location")
      .sort({ createdAt: -1 });

    // ❌ DO NOT handle message here (middleware already does it)

    return res.render("admin/applications/list", {
      applications,
      status
      // message is automatically available via res.locals.message
    });

  } catch (err) {
    console.error("Get Applications Error:", err);
    return res.status(500).send("Error fetching applications");
  }
};


// ================= APPROVE APPLICATION =================
exports.approveApplication = async (req, res) => {
  try {

    const application = await Application.findById(req.params.id);

    if (!application) {
      setMessage(req, "error", "Application not found");
      return res.redirect("/admin/applications");
    }

    application.status = "approved";
    await application.save();

    await checkAndCompleteCampaign(application.campaign);

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

    const application = await Application.findById(req.params.id);

    if (!application) {
      setMessage(req, "error", "Application not found");
      return res.redirect("/admin/applications");
    }

    application.status = "rejected";
    await application.save();

    setMessage(req, "success", "Application rejected successfully");

    return res.redirect("/admin/applications");

  } catch (err) {
    console.error("Reject Error:", err);
    setMessage(req, "error", "Error rejecting application");
    return res.redirect("/admin/applications");
  }
};