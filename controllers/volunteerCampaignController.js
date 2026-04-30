const Campaign = require('../models/campaign');
const { canChangeStatus } = require('../utils/campaignRules');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Notification Messages
const setMessage = (req, type, text) => {
  req.session.message = { type, text };
};


// Show create form
exports.createPage = (req, res) => {
  res.render('volunteer/campaigns/create');
};

// _________________________Campaign Creation by VOLUNTEER only__________________________
exports.createCampaign = async (req, res) => {
  try {
    const { name, description, goal} = req.body;

     //  Ensure logged-in user
    if (!req.user) {
      return res.redirect('/auth/login');
    }

    // role restriction for campaign creation
    if (req.user.role !== 'volunteer') {
      return res.status(403).send('Only volunteers can create campaigns');
    }

    //validation
    if (!name || !description || !goal) {
      setMessage(req, "error", "All fields are required");
      return res.redirect('/volunteer/campaigns/create');
    }
    if (!req.file) {
      setMessage(req, "error", "Image is required");
      return res.redirect('/volunteer/campaigns/create');
    }
   
    // numeric validation
    if (isNaN(goal) || goal <= 0) {
      setMessage(req, "error", "Goal must be a positive number");
      return res.redirect('/volunteer/campaigns/create');
    }
    // limit validation
    if (goal < 100 || goal > 10000000) {
      setMessage(req, "error", "Goal must be between 100 and 10,000,000");
      return res.redirect('/volunteer/campaigns/create');
    }

    await Campaign.create({
      name,
      description,
      goal,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      status: 'draft',
       //OWNERSHIP SHIFT
      createdBy: req.user.id
    });

    res.redirect('/volunteer/campaigns');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating campaign');
  }
};


exports.submitForApproval = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) return res.send("Not found");

  if (campaign.createdBy.toString() !== req.user.id.toString()) {
    return res.status(403).send("Not allowed");
  }

  if (campaign.status !== 'draft') {
    return res.send("Only draft can be submitted");
  }

  campaign.status = 'pending';
  await campaign.save();

  res.redirect('/volunteer/campaigns/my');
};