// This controller handles both:
// 1. Campaign creation (by volunteers)
// 2. Campaign management (by admin)

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

    // status filter
    if (status) {
      filter.status = status;
    }

    // search filter
    if (search) {
      const searchTerm = search.trim();
      const safeSearch = searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filter.name = {
        $regex: safeSearch,
        $options: 'i'
      };
    }

    const campaigns = await Campaign.find(filter).populate('createdBy', 'name role').sort({ createdAt: -1 });

    const message = req.session.message;
    req.session.message = null;

    res.render('admin/campaigns/list', {
      campaigns,
      message,
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
      .populate('createdBy', 'name role');

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



// __________________All controls are handled by the admin_______________
// Delete Campaign 
exports.deleteCampaign = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      setMessage(req, "error", "Invalid campaign ID");
      return res.redirect('/admin/campaigns');

    }
    //Find campaign 
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/admin/campaigns');
    }

    //Store image path before deleting DB record
    const imagePath = campaign.image
      ? path.join(__dirname, "..", campaign.image)
      : null;

    // Delete campaign from DB 
    await Campaign.findByIdAndDelete(req.params.id);

    // Then delete image file (if exists)
    if (imagePath) {
      fs.access(imagePath, fs.constants.F_OK, (err) => {
        if (!err) {
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.log("Image delete error:", err.message);
            } else {
              console.log("Image deleted successfully");
            }
          });
        } else {
          console.log("Image file does not exist, skipping delete");
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

// Approve Campaign 
exports.approveCampaign = async (req, res) => {
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

    if (!canChangeStatus(campaign.status, 'active')) {
      setMessage(req, "error", `Cannot approve a ${campaign.status} campaign`);
      return res.redirect('/admin/campaigns');
    }


    campaign.status = 'active';
    await campaign.save();

    setMessage(req, "success", "Campaign approved and now live");
    return res.redirect('/admin/campaigns');

  } catch (error) {
    setMessage(req, "error", "Server error while approving campaign");
    return res.redirect('/admin/campaigns');
  }
};


// Compeleted Campaign 
exports.completeCampaign = async (req, res) => {
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

    // validation
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
    const campaign = await Campaign.findById(req.params.id);

    //  Check if campaign exists
    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/admin/campaigns');
    }

    // Check if status change is allowed
    if (!canChangeStatus(campaign.status, 'rejected')) {
      setMessage(req, "error", `Cannot reject a ${campaign.status} campaign`);
      return res.redirect('/admin/campaigns');
    }

    // Update status
    campaign.status = 'rejected';
    await campaign.save();

    setMessage(req, "success", "Campaign rejected successfully");
    return res.redirect('/admin/campaigns');

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Server error while rejecting campaign");
    return res.redirect('/admin/campaigns');
  }
};