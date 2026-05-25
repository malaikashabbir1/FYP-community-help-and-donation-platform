const Donation = require('../models/donation');
const Campaign = require('../models/campaign');
const User = require('../models/user');
const FraudAlert = require("../models/fraudAlert");
const mongoose = require('mongoose');
const { setMessage } = require('../utils/flashMessage');
const logActivity = require('../utils/logActivity');
const { checkAndCompleteCampaign } = require('../services/campaignService');
const fraudService = require("../services/fraudDetectionService");


// 🔔 FIXED IMPORT
const { notifyAdmin, notifyUser } = require('../utils/notify');


// ================= ADD DONATION =================
exports.addDonation = async (req, res) => {
  try {

    const { campaignId, amount } = req.body;
    const amountNumber = Number(amount);

    // ================= VALIDATION =================

    if (!campaignId || !amountNumber || amountNumber <= 0) {
      setMessage(req, "error", "Invalid donation amount.");
      return res.redirect('/donor/dashboard');
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      setMessage(req, "error", "Invalid campaign ID.");
      return res.redirect('/donor/dashboard');
    }

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      setMessage(req, "error", "Campaign not found.");
      return res.redirect('/donor/dashboard');
    }

    if (campaign.status === "completed") {
      setMessage(req, "error", "Campaign already completed.");
      return res.redirect('/donor/dashboard');
    }

    if (campaign.status !== "active") {
      setMessage(req, "error", "Campaign not available.");
      return res.redirect('/donor/dashboard');
    }

    const remaining = Math.max(0, campaign.goal - campaign.raised);

    if (amountNumber < 50) {
      setMessage(req, "error", "Minimum donation is 50.");
      return res.redirect('/donor/donate/' + campaignId);
    }

    if (amountNumber > remaining) {
      setMessage(req, "error", `Donation exceeds remaining amount (${remaining}).`);
      return res.redirect('/donor/donate/' + campaignId);
    }

    // ================= SAVE DONATION =================

    const donation = await Donation.create({
      donor: req.user._id,
      campaign: campaign._id,
      amount: amountNumber
    });

    // ================= UPDATE CAMPAIGN =================

    campaign.raised += amountNumber;
    campaign.donationCount = (campaign.donationCount || 0) + 1;
    await campaign.save();

    // ================= ACTIVITY LOG =================

    await logActivity({
      type: "donation",
      refId: campaign._id,
      userId: req.user._id,
      description: `${req.user.name} donated PKR ${amountNumber} to ${campaign.name}`
    });

    // ================= USER UPDATE =================

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { donationCount: 1 }
    });

    await checkAndCompleteCampaign(campaign._id);

    // =====================================================
    // 🚨 POST-TRANSACTION FRAUD DETECTION
    // =====================================================

    const fraudResult = await fraudService.detectFraud(
      req.user._id,
      campaign._id,
      amountNumber
    );

    // ================= SAVE FRAUD ALERTS =================
if (fraudResult.flags && fraudResult.flags.length > 0) {

    const alertKey =
        `${req.user._id}_${campaign._id}_${fraudResult.flags.join("_")}`;

    const existingAlert =
        await FraudAlert.findOne({
            user: req.user._id,
            campaign: campaign._id,
            type: "behavior_anomaly",
            alertKey: alertKey,
            createdAt: {
                $gte: new Date(
                    Date.now() - 60 * 1000
                )
            }
        });

    if (!existingAlert) {

        await FraudAlert.create({
            user: req.user._id,
            campaign: campaign._id,
            type: "behavior_anomaly",
            alertKey: alertKey,

            message:
                fraudResult.flags.join(", "),

            severity:
                fraudResult.isFraud
                ? 80
                : 40,

            source: "realtime",

            createdAt: new Date()
        });

    }
}

    // ================= ADMIN NOTIFICATION (optional) =================

    if (fraudResult.isFraud) {

      await notifyAdmin(
        `🚨 Suspicious donation detected from ${req.user.name} in "${campaign.name}"`,
        `/admin/fraud-alerts`
      );

      setMessage(
        req,
        "error",
        "Donation completed but flagged for review due to unusual activity."
      );

      return res.redirect('/donor/dashboard');
    }

    // ================= NORMAL NOTIFICATIONS =================

    await notifyAdmin(
      `${req.user.name} donated PKR ${amountNumber} to "${campaign.name}"`,
      `/admin/donations`
    );

    await notifyUser(
      req.user._id,
      `You successfully donated PKR ${amountNumber} to "${campaign.name}"`,
      `/campaign/${campaign._id}`,
      "success"
    );

    // ================= SUCCESS RESPONSE =================

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

    const totalDonated = donations.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    );

    res.render('donor/myDonations', {
      donations,
      totalDonated,
      user: req.user 
    });

  } catch (error) {
    console.log(error);
    res.redirect('/donor/dashboard');
  }
};