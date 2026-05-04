const Campaign = require('../models/campaign');
const { canChangeStatus } = require('../utils/campaignRules');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Notification Messages
const setMessage = (req, type, text) => {
  req.session.message = { type, text };
};

// Show all campaigns
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

    res.render('admin/campaigns/list', {
      campaigns,
      search,
      status
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};


// REVIEW PAGE
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


// DELETE CAMPAIGN
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

    await Campaign.findByIdAndDelete(req.params.id);

    if (imagePath) {
      fs.access(imagePath, fs.constants.F_OK, (err) => {
        if (!err) {
          fs.unlink(imagePath, (err) => {
            if (err) console.log("Image delete error:", err.message);
            else console.log("Image deleted successfully");
          });
        }
      });
    }

    setMessage(req, "success", "Campaign deleted successfully");
    return res.redirect('/admin/campaigns');

  } catch (error) {
    setMessage(req, "error", "Server error while deleting campaign");
    return res.redirect('/admin/campaigns');
  }
};


// APPROVE CAMPAIGN
exports.approveCampaign = async (req, res) => {
  try {

    if (req.user.role !== 'admin') {
      return res.status(403).send("Unauthorized");
    }

    const _id = req.params.id; 

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      setMessage(req, "error", "Invalid campaign ID");
      return res.redirect('/admin/campaigns');
    }

    const campaign = await Campaign.findById(_id);

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

    setMessage(req, "success", "Campaign approved and now live");
    return res.redirect('/admin/campaigns');
    

  } catch (error) {
    console.error(error);
    setMessage(req, "error", "Server error while approving campaign");
    return res.redirect('/admin/campaigns');
  }
};


// COMPLETE CAMPAIGN
exports.completeCampaign = async (req, res) => {
  try {

    const _id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      setMessage(req, "error", "Invalid campaign ID");
      return res.redirect('/admin/campaigns');
    }

    const campaign = await Campaign.findById(_id);

    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/admin/campaigns');
    }

    if (!canChangeStatus(campaign.status, 'completed')) {
      setMessage(req, "error", `Cannot complete a ${campaign.status} campaign`);
      return res.redirect('/admin/campaigns');
    }

    campaign.status = 'completed';
    await campaign.save();

    setMessage(req, "success", "Campaign marked as completed");
    return res.redirect('/admin/campaigns');

  } catch (error) {
    console.error(error);
    setMessage(req, "error", "Server error while completing campaign");
    return res.redirect('/admin/campaigns');
  }
};


// REJECT CAMPAIGN
exports.rejectCampaign = async (req, res) => {
  try {

    if (req.user.role !== 'admin') {
      return res.status(403).send("Unauthorized");
    }

    const _id = req.params.id;
    const campaign = await Campaign.findById(_id);

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
      return res.redirect(`/admin/campaigns/${_id}/review`);
    }

    campaign.status = 'rejected';
    campaign.rejectionReason = reason.trim();

    campaign.reviewedAt = new Date();

    await campaign.save();

    setMessage(req, "success", "Campaign rejected successfully");
    return res.redirect('/admin/campaigns');

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Server error while rejecting campaign");
    return res.redirect('/admin/campaigns');
  }
};