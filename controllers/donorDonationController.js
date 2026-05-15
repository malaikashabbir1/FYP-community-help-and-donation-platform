const Donation = require('../models/donation');
const Campaign = require('../models/campaign');
const mongoose = require('mongoose');
const { setMessage } = require('../utils/flashMessage');
const { checkAndCompleteCampaign } = require('../services/campaignService');


// ================= ADD DONATION =================
exports.addDonation = async (req, res) => {
  try {
    const { campaignId, amount, description } = req.body;
    const amountNumber = Number(amount);

    // 1️⃣ Basic validation
    if (!campaignId || !amountNumber || amountNumber <= 0) {
      setMessage(req, "error", "Invalid donation amount.");
      return res.redirect('/donor/dashboard');
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      setMessage(req, "error", "Invalid campaign ID.");
      return res.redirect('/donor/dashboard');
    }

    // 2️⃣ Fetch campaign
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      setMessage(req, "error", "Campaign not found.");
      return res.redirect('/donor/dashboard');
    }

    // ❌ Block completed campaigns
    if (campaign.status === "completed") {
      setMessage(req, "error", "Campaign already completed.");
      return res.redirect('/donor/dashboard');
    }

    if (campaign.status !== "active") {
      setMessage(req, "error", "Campaign not available.");
      return res.redirect('/donor/dashboard');
    }

    // 🥈 Donation validation
    const remaining = Math.max(0, campaign.goal - campaign.raised);

    if (amountNumber < 50) {
      setMessage(req, "error", "Minimum donation is 50.");
      return res.redirect('/donor/donate/' + campaignId);
    }

    if (amountNumber > remaining) {
      setMessage(
        req,
        "error",
        `Donation exceeds remaining amount (${remaining}).`
      );
      return res.redirect('/donor/donate/' + campaignId);
    }

    // 3️⃣ Save donation
    await Donation.create({
      donor: req.user._id,
      campaign: campaign._id,
      amount: amountNumber,
      description
    });

    // 4️⃣ Update campaign donation progress
    campaign.raised += amountNumber;
    await campaign.save();

    // 5️⃣ IMPORTANT: check completion AFTER update
    await checkAndCompleteCampaign(campaign._id);

    // 6️⃣ Success response
    setMessage(req, "success", "Donation successfully completed.");
    return res.redirect('/donor/dashboard');

  } catch (err) {
    console.error(err);

    setMessage(req, "error", "Something went wrong. Please try again.");
    return res.redirect('/donor/dashboard');
  }
};


// ================= MY DONATIONS =================
exports.getMyDonations = async (req, res) => {
  try {
    const donorId = req.user._id;

    const donations = await Donation.find({ donor: donorId })
      .populate('campaign')
      .sort({ createdAt: -1 });

    const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);

    res.render('donor/myDonations', {
      donations,
      totalDonated
    });

  } catch (error) {
    console.log(error);
    res.redirect('/donor/dashboard');
  }
};