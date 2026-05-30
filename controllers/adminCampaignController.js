const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const { canChangeStatus } = require('../utils/campaignRules');
const mongoose = require('mongoose');
const logActivity = require('../utils/logActivity');
const fs = require('fs');
const path = require('path');
const { setMessage } = require('../utils/flashMessage');
const { checkAndCompleteCampaign } = require('../services/campaignService');

// 🔔 FIXED IMPORT
const { notifyUser } = require('../utils/notify');


// ================= GET ALL CAMPAIGNS =================
exports.getAllCampaigns = async (req, res) => {
  try {

    const { search = '', status = '' } = req.query;

    let filter = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'draft' };
    }

    if (search) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filter.name = {
        $regex: safeSearch,
        $options: 'i'
      };
    }

    const campaigns = await Campaign.find(filter)
      .populate('createdBy', 'name role _id')
      .sort({ createdAt: -1 });

    const approvedCounts = await Application.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$campaign",
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};

    approvedCounts.forEach(item => {
      countMap[item._id.toString()] = item.count;
    });

    const campaignsWithStats = campaigns.map(c => {
      const obj = c.toObject();
      obj.approvedApplications = countMap[c._id.toString()] || 0;
      return obj;
    });

    res.render('admin/campaigns/list', {
      campaigns: campaignsWithStats,
      search,
      status
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};


// ================= REVIEW PAGE =================
exports.reviewPage = async (req, res) => {
  try {

    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'name role _id');

    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/admin/campaigns');
    }

    res.render('admin/campaigns/review', { campaign });

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Error loading campaign");
    res.redirect('/admin/campaigns');
  }
};


// ================= DELETE CAMPAIGN =================
exports.deleteCampaign = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      setMessage(req, "error", "Invalid campaign ID");
      return res.redirect('/admin/campaigns');
    }

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/admin/campaigns');
    }

    const imagePath = campaign.image
      ? path.join(__dirname, "..", campaign.image)
      : null;

    await Application.deleteMany({ campaign: req.params.id });

    if (imagePath) {
      fs.access(imagePath, fs.constants.F_OK, (err) => {
        if (!err) {
          fs.unlink(imagePath, (err) => {
            if (err) console.log("Image delete error:", err.message);
          });
        }
      });
    }

    await Campaign.findByIdAndDelete(req.params.id);

    setMessage(req, "success", "Campaign deleted successfully");
    return res.redirect('/admin/campaigns');

  } catch (error) {
    console.error(error);
    setMessage(req, "error", "Server error while deleting campaign");
    return res.redirect('/admin/campaigns');
  }
};


// ================= APPROVE CAMPAIGN =================
exports.approveCampaign = async (req, res) => {
  try {

    if (req.user.role !== 'admin') {
      return res.status(403).send("Unauthorized");
    }

    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', '_id name email');

    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/admin/campaigns');
    }

    if (campaign.status === 'active') {
      setMessage(req, "error", "Campaign is already active");
      return res.redirect('/admin/campaigns');
    }

    if (!canChangeStatus(campaign.status, 'active')) {
      setMessage(req, "error", `Cannot approve a ${campaign.status} campaign`);
      return res.redirect('/admin/campaigns');
    }

    campaign.status = 'active';
    await campaign.save();

    const userId = campaign.createdBy?._id || campaign.createdBy;

    await logActivity({
      type: "campaign",
      refId: campaign._id,
      userId: campaign.createdBy?._id || campaign.createdBy,
      description: `Campaign "${campaign.name}" has been approved`
    });

    // 🔔 FIXED NOTIFICATION
    if (userId) {
      await notifyUser(
        userId,
        "Your campaign has been approved and is now live!",
        `/campaign/${campaign._id}`,
        "success"
      );
    }

    setMessage(req, "success", "Campaign approved and now live");
    return res.redirect('/admin/campaigns');

  } catch (error) {
    console.error(error);
    setMessage(req, "error", "Server error while approving campaign");
    return res.redirect('/admin/campaigns');
  }
};


// ================= COMPLETE CAMPAIGN =================
exports.completeCampaign = async (req, res) => {
  try {

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/admin/campaigns');
    }

    const updatedCampaign = await checkAndCompleteCampaign(campaign._id);

    const userId = updatedCampaign?.createdBy?._id || updatedCampaign?.createdBy;

    // 🔔 FIXED NOTIFICATION
    if (updatedCampaign?.status === "completed" && userId) {
      await notifyUser(
        userId,
        "Your campaign has been marked as completed!",
        `/campaign/${updatedCampaign._id}`,
        "success"
      );
    }

    if (!updatedCampaign || updatedCampaign.status !== "completed") {
      setMessage(req, "error", "Requirements not met (funding or volunteers missing)");
      return res.redirect('/admin/campaigns');
    }

    setMessage(req, "success", "Campaign marked as completed");
    return res.redirect('/admin/campaigns');

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Server error");
    return res.redirect('/admin/campaigns');
  }
};


// ================= REJECT CAMPAIGN =================
exports.rejectCampaign = async (req, res) => {
  try {

    if (req.user.role !== 'admin') {
      return res.status(403).send("Unauthorized");
    }

    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', '_id name email');

    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/admin/campaigns');
    }

    if (campaign.status === 'rejected') {
      setMessage(req, "error", "Campaign is already rejected");
      return res.redirect('/admin/campaigns');
    }

    if (!canChangeStatus(campaign.status, 'rejected')) {
      setMessage(req, "error", `Cannot reject a ${campaign.status} campaign`);
      return res.redirect('/admin/campaigns');
    }

    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      setMessage(req, "error", "Rejection reason is required");
      return res.redirect(`/admin/campaigns/${req.params.id}/review`);
    }

    campaign.status = 'rejected';
    campaign.rejectionReason = reason.trim();
    campaign.reviewedAt = new Date();

    await campaign.save();

    const userId = campaign.createdBy?._id || campaign.createdBy;

    await logActivity({
      type: "campaign",
      refId: campaign._id,
      userId: campaign.createdBy?._id || campaign.createdBy,
      description: `Campaign "${campaign.name}" was rejected`
    });

    // 🔔 FIXED NOTIFICATION
    if (userId) {
      await notifyUser(
        userId,
        `Your campaign was rejected. Reason: ${reason}`,
        `/campaign/${campaign._id}`,
        "error"
      );
    }

    setMessage(req, "success", "Campaign rejected successfully");
    return res.redirect('/admin/campaigns');

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Server error while rejecting campaign");
    return res.redirect('/admin/campaigns');
  }
};