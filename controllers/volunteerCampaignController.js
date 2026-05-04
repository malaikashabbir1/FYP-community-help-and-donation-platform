const Campaign = require('../models/campaign');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Notification Messages
const setMessage = (req, type, text) => {
  req.session.message = { type, text };
};


// CREATE PAGE
exports.createPage = (req, res) => {
  res.render('volunteer/campaigns/create');
};


// ================= CREATE CAMPAIGN =================
exports.createCampaign = async (req, res) => {
  try {
    const { name, description, goal } = req.body;

    if (!req.user) {
      return res.redirect('/auth/login');
    }

    if (req.user.role !== 'volunteer') {
      return res.status(403).send('Only volunteers can create campaigns');
    }

    if (!name || !description || !goal) {
      setMessage(req, "error", "All fields are required");
      return res.redirect('/volunteer/campaigns/create');
    }

    if (!req.file) {
      setMessage(req, "error", "Image is required");
      return res.redirect('/volunteer/campaigns/create');
    }

    if (isNaN(goal) || goal <= 0) {
      setMessage(req, "error", "Goal must be a positive number");
      return res.redirect('/volunteer/campaigns/create');
    }

    if (goal < 100 || goal > 10000000) {
      setMessage(req, "error", "Goal must be between 100 and 10,000,000");
      return res.redirect('/volunteer/campaigns/create');
    }

    await Campaign.create({
      name,
      description,
      goal,
      image: `/uploads/${req.file.filename}`,
      status: 'draft',
      createdBy: req.user._id // 🔥 FIX
    });

    res.redirect('/volunteer/campaigns/my');

  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating campaign');
  }
};


// ================= SUBMIT FOR APPROVAL =================
exports.submitForApproval = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/volunteer/campaigns/my');
    }

    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      setMessage(req, "error", "Not authorized");
      return res.redirect('/volunteer/campaigns/my');
    }

    if (campaign.status !== 'draft') {
      setMessage(req, "error", "Only draft campaigns can be submitted");
      return res.redirect('/volunteer/campaigns/my');
    }

    campaign.status = 'pending';
    await campaign.save();

    setMessage(req, "success", "Campaign submitted for approval");
    return res.redirect('/volunteer/campaigns/my');

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Error submitting campaign");
    return res.redirect('/volunteer/campaigns/my');
  }
};


// ================= MY CAMPAIGNS =================
exports.myCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      createdBy: req.user._id // 🔥 FIX
    }).sort({ createdAt: -1 });

    res.render('volunteer/campaigns/myCampaigns', {
      user: req.user,
      campaigns
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading campaigns');
  }
};


// ================= JOIN CAMPAIGN =================
exports.joinCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) return res.send("Not found");

    const userId = req.user._id; // 🔥 FIX

    if (!campaign.volunteers.map(v => v.toString()).includes(userId.toString())) {
      campaign.volunteers.push(userId);
      await campaign.save();
    }

    res.redirect('/campaigns/live');

  } catch (err) {
    console.error(err);
    res.status(500).send('Error joining campaign');
  }
};


// ================= EDIT PAGE =================
exports.editPage = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/volunteer/campaigns/my');
    }

    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("Not authorized");
    }

    if (campaign.status !== 'draft') {
      setMessage(req, "error", "Only draft campaigns can be edited");
      return res.redirect('/volunteer/campaigns/my');
    }

    res.render('volunteer/campaigns/edit', { campaign });

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Error loading campaign");
    return res.redirect('/volunteer/campaigns/my');
  }
};


// ================= UPDATE CAMPAIGN =================
exports.updateCampaign = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      setMessage(req, "error", "Invalid campaign ID");
      return res.redirect('/volunteer/campaigns/my');
    }

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/volunteer/campaigns/my');
    }

    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("Not authorized");
    }

    if (campaign.status !== 'draft') {
      setMessage(req, "error", "Only draft campaigns can be edited");
      return res.redirect('/volunteer/campaigns/my');
    }

    const { name, description, goal } = req.body;

    if (!name || !description || !goal) {
      setMessage(req, "error", "All fields are required");
      return res.redirect(`/volunteer/campaigns/edit/${req.params.id}`);
    }

    if (isNaN(goal) || Number(goal) <= 0) {
      setMessage(req, "error", "Goal must be a positive number");
      return res.redirect(`/volunteer/campaigns/edit/${req.params.id}`);
    }

    campaign.name = name;
    campaign.description = description;
    campaign.goal = goal;

    if (req.file) {
      campaign.image = `/uploads/${req.file.filename}`;
    }

    await campaign.save();

    setMessage(req, "success", "Campaign updated successfully");
    return res.redirect('/volunteer/campaigns/my');

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Something went wrong while updating campaign");
    return res.redirect('/volunteer/campaigns/my');
  }
};

