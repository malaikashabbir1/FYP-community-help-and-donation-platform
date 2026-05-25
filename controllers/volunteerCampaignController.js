const Campaign = require('../models/campaign');
const Application = require('../models/application');
const FraudAlert = require("../models/fraudAlert");
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const logActivity = require('../utils/logActivity');
const fraudService = require("../services/fraudDetectionService");
const { checkAndCompleteCampaign } = require('../services/campaignService');

// 🔔 FIXED IMPORT (IMPORTANT)
const { notifyAdmin, notifyUser } = require('../utils/notify');

// ================= FLASH MESSAGE =================
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
    const {
      name,
      description,
      goal,
      requiredVolunteers,
      location,
      urgency,
      category,
      subCategory
    } = req.body;

    if (!req.user) return res.redirect('/auth/login');

    if (req.user.role !== 'volunteer') {
      return res.status(403).send('Only volunteers can create campaigns');
    }

    if (
      !name ||
      !description ||
      !goal ||
      !requiredVolunteers ||
      !location ||
      !category ||
      !subCategory
    ) {
      setMessage(req, "error", "All required fields must be filled");
      return res.redirect('/volunteer/campaigns/create');
    }

    if (!req.file) {
      setMessage(req, "error", "Image is required");
      return res.redirect('/volunteer/campaigns/create');
    }

    const goalNum = Number(goal);
    const volNum = Number(requiredVolunteers);

    if (isNaN(goalNum) || goalNum <= 0) {
      setMessage(req, "error", "Goal must be a positive number");
      return res.redirect('/volunteer/campaigns/create');
    }

    if (goalNum < 100 || goalNum > 10000000) {
      setMessage(req, "error", "Goal must be between 100 and 10,000,000");
      return res.redirect('/volunteer/campaigns/create');
    }

    const allowedUrgency = ['low', 'medium', 'high', 'emergency'];
    if (urgency && !allowedUrgency.includes(urgency)) {
      setMessage(req, "error", "Invalid urgency value");
      return res.redirect('/volunteer/campaigns/create');
    }

    const campaign = await Campaign.create({
      name,
      description,
      goal: goalNum,
      requiredVolunteers: volNum,
      location,
      urgency: urgency || "medium",
      category,
      subCategory,
      image: `/uploads/${req.file.filename}`,
      status: 'draft',
      createdBy: req.user._id
    });

    // 🔔 FIXED
    await notifyUser(
      req.user._id,
      `Campaign "${campaign.name}" created successfully`,
      "/volunteer/campaigns/my",
      "success"
    );

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
      return res.status(403).send("Not authorized");
    }

    if (campaign.status !== 'draft') {
      setMessage(req, "error", "Only draft campaigns can be submitted");
      return res.redirect('/volunteer/campaigns/my');
    }

    campaign.status = 'pending';
    await campaign.save();

    // 🔔 FIXED (ADMIN NOTIFICATION + USER NOTIFICATION)
    await notifyAdmin(
      `New campaign submitted: ${campaign.name}`,
      `/admin/campaigns/${campaign._id}/review`
    );

    await notifyUser(
      req.user._id,
      `Campaign "${campaign.name}"submitted for approval`,
      "/volunteer/campaigns/my",
      "info"
    );

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
    const campaigns = await Campaign.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    const campaignIds = campaigns.map(c => c._id);

    const approvedApplications = await Application.find({
      campaign: { $in: campaignIds },
      status: "approved"
    }).lean();

    const approvedCountMap = {};

    approvedApplications.forEach(app => {
      const id = app.campaign.toString();
      approvedCountMap[id] = (approvedCountMap[id] || 0) + 1;
    });

    res.render('volunteer/campaigns/myCampaigns', {
      user: req.user,
      campaigns,
      approvedCountMap
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading campaigns');
  }
};

// ================= JOIN PAGE =================
exports.joinPage = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      setMessage(req, "error", "Campaign not found");
      return res.redirect('/campaigns/live');
    }

    let existingApplication = null;

    if (req.user) {
      existingApplication = await Application.findOne({
        user: req.user._id,
        campaign: campaign._id
      });
    }

    return res.render("volunteer/campaigns/join", {
      campaign,
      user: req.user,
      existingApplication,
      message: null
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send("Error loading join page");
  }
};

// ================= JOIN CAMPAIGN =================
exports.joinCampaign = async (req, res) => {
  try {
    if (!req.user) return res.redirect('/auth/login');

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.render("volunteer/campaigns/join", {
        campaign: null,
        message: { type: "error", text: "Campaign not found" },
        existingApplication: null
      });
    }

    if (campaign.status !== "active" && campaign.status !== "approved") {
      return res.render("volunteer/campaigns/join", {
        campaign,
        message: { type: "error", text: "This campaign is not open for joining" },
        existingApplication: null
      });
    }

    const existing = await Application.findOne({
      user: req.user._id,
      campaign: campaign._id
    });

    if (existing) {
      return res.render("volunteer/campaigns/join", {
        campaign,
        message: {
          type: "error",
          text: "You have already applied for this campaign."
        },
        existingApplication: existing
      });
    }

    const phone = req.body.phone?.trim();
    const message = req.body.message?.trim();
    const skills = req.body.skills;
    const availability = req.body.availability;

    const phoneRegex = /^03\d{9}$/;

    if (!message || !phone || !skills) {
      return res.render("volunteer/campaigns/join", {
        campaign,
        message: { type: "error", text: "All required fields must be filled." },
        existingApplication: null
      });
    }

    if (!phoneRegex.test(phone)) {
      return res.render("volunteer/campaigns/join", {
        campaign,
        message: { type: "error", text: "Invalid phone number format. Use 03XXXXXXXXX" },
        existingApplication: null
      });
    }

    const application = await Application.create({
      user: req.user._id,
      campaign: campaign._id,
      message,
      phone,
      availability,
      skills,
      status: "pending"
    });

    
// ================= FRAUD DETECTION (POST-SUBMISSION) =================

const fraudResult = await fraudService.detectFraud(
  req.user._id,
  campaign._id,
  0   // no donation amount for applications
);

// ================= SAVE FRAUD ALERT =================

if (fraudResult.flags && fraudResult.flags.length > 0) {

  await FraudAlert.create({
    user: req.user._id,
    campaign: campaign._id,
    type: "excessive_applications",
    message: fraudResult.flags.join(", "),
    severity: fraudResult.isFraud ? 70 : 30,
    source: "realtime", 
    createdAt: new Date()
  });

}

// ================= ADMIN NOTIFICATION (optional upgrade) =================

if (fraudResult.isFraud) {

  await notifyAdmin(
    ` Suspicious volunteer application detected from ${req.user.name} for "${campaign.name}"`,
    `/admin/applications/${application._id}`
  );

}
    await logActivity({
      type: "application",
      refId: application._id,
      userId: req.user._id,
      description:  `${req.user.name} applied for "${campaign.name}" (pending approval)`
    });

    await checkAndCompleteCampaign(campaign._id);

    // 🔔 Notify Admin
    await notifyAdmin(
      `${req.user.name} submitted an application for "${campaign.name}"`,
      `/admin/applications/${application._id}`,
      "info"
    );

    // 🔔 Notify User
    await notifyUser(
      req.user._id,
      `Application for "${campaign.name}" submitted and pending approval`,
      "/volunteer/applications",
      "success"
    );

    setMessage(req, "success", "Application submitted successfully and is pending approval");

    return res.redirect('/campaigns/live');

  } catch (err) {
    console.error(err);
    return res.render("volunteer/campaigns/join", {
      campaign: null,
      message: { type: "error", text: "Something went wrong while applying" },
      existingApplication: null
    });
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

    if (!["draft", "rejected"].includes(campaign.status)) {
      setMessage(req, "error", "You cannot edit this campaign");
      return res.redirect('/volunteer/campaigns/my');
    }

    return res.render('volunteer/campaigns/edit', { campaign });

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Error loading campaign");
    return res.redirect('/volunteer/campaigns/my');
  }
};

// ================= UPDATE CAMPAIGN =================
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

    const {
      name,
      description,
      goal,
      requiredVolunteers,
      location,
      urgency,
      resubmit
    } = req.body;

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

    // ✅ Update fields
    campaign.name = name;
    campaign.description = description;
    campaign.goal = Number(goal);
    campaign.requiredVolunteers = Number(requiredVolunteers) || 0;
    campaign.location = location || "";
    campaign.urgency = urgency || campaign.urgency;

    if (req.file) {
      campaign.image = `/uploads/${req.file.filename}`;
    }

    // ✅ IMPORTANT: handle resubmission
    const isResubmit = resubmit === "true";

    if (isResubmit && campaign.status === "rejected") {
      campaign.status = "pending";
      campaign.rejectionReason = "";
      campaign.reviewedAt = null;
    }

    await campaign.save();

    // 🔔 Notifications only if resubmitted
    if (isResubmit && campaign.status === "pending") {
      await notifyAdmin(
        `Campaign resubmitted: ${campaign.name}`,
        `/admin/campaigns/${campaign._id}/review`,
        "info"
      );

      await notifyUser(
        req.user._id,
        `Your campaign "${campaign.name}" has been resubmitted`,
        "/volunteer/campaigns/my",
        "success"
      );
    }

    setMessage(
      req,
      "success",
      isResubmit
        ? "Campaign updated & resubmitted successfully"
        : "Campaign updated successfully"
    );

    return res.redirect('/volunteer/campaigns/my');

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Something went wrong");
    return res.redirect('/volunteer/campaigns/my');
  }
};

// ================= ADD UPDATE =================
exports.addUpdate = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) return res.status(404).send("Campaign not found");

    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("Not authorized");
    }

    const text = req.body.text?.trim();

    if (!text) return res.status(400).send("Update text is required");

    campaign.updates = campaign.updates || [];

    campaign.updates.push({
      text,
      createdAt: new Date()
    });

    await campaign.save();

    // 🔔 FIXED
    await notifyUser(
      req.user._id,
      "Campaign update added successfully",
      `/campaigns/${req.params.id}`,
      "info"
    );

    return res.redirect('/campaigns/' + req.params.id);

  } catch (err) {
    console.error(err);
    return res.status(500).send("Error adding update");
  }
};
