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


// Show the existing campaign data for the Edit option
exports.editPage = async (req, res) => {
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

    res.render('admin/campaigns/edit', { campaign });

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Error loading campaign");
    return res.redirect('/admin/campaigns');
  }
};

// Edit the campaign
exports.updateCampaign = async (req, res) => {
  try {
    //  Invalid ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      setMessage(req, "error", "Invalid campaign ID");
      return res.redirect('/admin/campaigns');
    }

    const campaign = await Campaign.findById(req.params.id);

    // Not found
    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/admin/campaigns');
    }

    // User is NOT owner AND NOT admin → block access
    if ( campaign.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).send("Not authorized to edit this campaign");
    }

    // STATUS CHECK (prevent editing active campaigns) ONLY ADMIN CAN
    if (campaign.status !== 'draft' && req.user.role !== 'admin') {
      setMessage(req, "error", "Approved campaigns cannot be edited");
      return res.redirect('/admin/campaigns');
    }


    const { name, description, goal } = req.body;

    // Validation errors
    if (!name || !description || !goal) {
      setMessage(req, "error", "All fields are required");
      return res.redirect(`/admin/campaigns/edit/${req.params.id}`);
    }

    if (isNaN(goal) || Number(goal) <= 0) {
      setMessage(req, "error", "Goal must be a positive number");
      return res.redirect(`/admin/campaigns/edit/${req.params.id}`);
    }

    // Update fields
    campaign.name = name;
    campaign.description = description;
    campaign.goal = goal;

    // SAFE IMAGE HANDLING
    const oldImage = campaign.image;

    if (req.file) {
      if (oldImage) {
        const oldPath = path.join(__dirname, '..', oldImage);
        fs.unlink(oldPath, (err) => {
          if (err) console.log("Old image delete error:", err.message);
        });
      }

      campaign.image = `/uploads/${req.file.filename}`;
    }

    await campaign.save();

    // Success message
    setMessage(req, "success", "Campaign updated successfully");
    return res.redirect('/admin/campaigns');

  } catch (err) {
    console.error(err);

    // Server error 
    setMessage(req, "error", "Something went wrong while updating campaign");
    return res.redirect('/admin/campaigns');
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