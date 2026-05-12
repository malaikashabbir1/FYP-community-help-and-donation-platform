const Campaign = require('../models/campaign');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { checkAndCompleteCampaign } = require('../services/campaignService');

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
    const { name, description, goal, requiredVolunteers, location, urgency } = req.body;

    if (!req.user) {
      return res.redirect('/auth/login');
    }

    if (req.user.role !== 'volunteer') {
      return res.status(403).send('Only volunteers can create campaigns');
    }

    if (!name || !description || !goal) {
      setMessage(req, "error", "All required fields must be filled");
      return res.redirect('/volunteer/campaigns/create');
    }

    if (!req.file) {
      setMessage(req, "error", "Image is required");
      return res.redirect('/volunteer/campaigns/create');
    }

    // goal validation
    if (isNaN(goal) || goal <= 0) {
      setMessage(req, "error", "Goal must be a positive number");
      return res.redirect('/volunteer/campaigns/create');
    }

    if (goal < 100 || goal > 10000000) {
      setMessage(req, "error", "Goal must be between 100 and 10,000,000");
      return res.redirect('/volunteer/campaigns/create');
    }

    // urgency validation
    const allowedUrgency = ['low', 'medium', 'high', 'emergency'];
    if (urgency && !allowedUrgency.includes(urgency)) {
      setMessage(req, "error", "Invalid urgency value");
      return res.redirect('/volunteer/campaigns/create');
    }

    await Campaign.create({
      name,
      description,
      goal: Number(goal),
      requiredVolunteers: Number(requiredVolunteers) || 0,
      location: location || "",
      urgency: urgency || "medium",
      image: `/uploads/${req.file.filename}`,
      status: 'draft',
      createdBy: req.user._id
    });

    return res.redirect('/volunteer/campaigns/my');

  } catch (err) {
    console.error(err);
    return res.status(500).send('Error creating campaign');
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
      createdBy: req.user._id 
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

    if (!campaign) {
      return res.send("Campaign not found");
    }

    // prevent joining completed campaign
    if (campaign.status === "completed") {
      return res.send("Campaign already completed");
    }

    // prevent duplicate joining
    if (!campaign.volunteers.includes(req.user._id)) {

      campaign.volunteers.push(req.user._id);

      await campaign.save();

      //AUTO COMPLETION CHECK
      await checkAndCompleteCampaign(campaign._id);
    }

    res.redirect('/campaigns/' + campaign._id);

  } catch (err) {

    console.error(err);

    res.status(500).send('Error joining campaign');
  }
};


// ____________________EDIT PAGE 
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

    // allow edit for draft + rejected only
    if (campaign.status !== "draft" && campaign.status !== "rejected") {
      setMessage(req, "error", "You cannot edit this campaign");
      return res.redirect('/volunteer/campaigns/my');
    }

    return res.render('volunteer/campaigns/edit', {
      campaign
    });

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Error loading campaign");
    return res.redirect('/volunteer/campaigns/my');
  }
};



// update Campaign
exports.updateCampaign = async (req, res) => {
  try {

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/volunteer/campaigns/my');
    }

    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("Not authorized");
    }

    const { name, description, goal, requiredVolunteers, location, urgency } = req.body;

    if (!name || !description || !goal) {
      setMessage(req, "error", "All required fields must be filled");
      return res.redirect(`/volunteer/campaigns/edit/${req.params.id}`);
    }

    // urgency validation
    const allowedUrgency = ['low', 'medium', 'high', 'emergency'];
    if (urgency && !allowedUrgency.includes(urgency)) {
      setMessage(req, "error", "Invalid urgency value");
      return res.redirect('back');
    }

    // prevent useless update (NOW FULLY FIXED)
    const noChange =
      campaign.name === name &&
      campaign.description === description &&
      Number(campaign.goal) === Number(goal) &&
      campaign.requiredVolunteers === Number(requiredVolunteers) &&
      campaign.location === location &&
      campaign.urgency === urgency &&
      !req.file;

    if (noChange) {
      setMessage(req, "error", "No changes detected.");
      return res.redirect(`/volunteer/campaigns/edit/${req.params.id}`);
    }

    // update fields
    campaign.name = name;
    campaign.description = description;
    campaign.goal = Number(goal);

    campaign.requiredVolunteers = Number(requiredVolunteers) || 0;
    campaign.location = location || "";
    campaign.urgency = urgency || campaign.urgency;

    if (req.file) {
      campaign.image = `/uploads/${req.file.filename}`;
    }

    // resubmit logic
    if (campaign.status === "rejected") {
      campaign.status = "pending";
      campaign.rejectionReason = "";
      campaign.reviewedAt = null;
    }

    await campaign.save();

    setMessage(req, "success", "Campaign updated successfully");
    return res.redirect('/volunteer/campaigns/my');

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Something went wrong");
    return res.redirect('/volunteer/campaigns/my');
  }
};

// Post updates inside campaign timeline
exports.addUpdate = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).send("Campaign not found");
    }

    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("Not authorized");
    }

    const text = req.body.text?.trim();

    if (!text) {
      return res.status(400).send("Update text is required");
    }

    if (!campaign.updates) {
      campaign.updates = [];
    }

    campaign.updates.push({
      text,
      createdAt: new Date()
    });

    await campaign.save();

    return res.redirect('/campaigns/' + req.params.id);

  } catch (err) {
    console.error(err);
    return res.status(500).send("Error adding update");
  }
};