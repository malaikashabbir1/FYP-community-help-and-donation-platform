const User = require('../models/user');
const Donor = require('../models/donor');
const Campaign = require('../models/campaign');
const mongoose = require('mongoose');
const { setMessage } = require('../utils/flashMessage');


// ===============================
// DONOR DASHBOARD
// ===============================
exports.getDonorDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total donations count
    const totalDonations = await Donor.countDocuments({ userId });

    // Pending donations
    const pendingDonations = await Donor.countDocuments({
      userId,
      status: 'pending'
    });

    // Completed donations
    const completedDonations = await Donor.countDocuments({
      userId,
      status: 'completed'
    });

    // Total amount donated (IMPORTANT FIX)
    const totalAmountResult = await Donor.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalAmount =
      totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;

    // Active campaigns
    const activeCampaigns = await Campaign.countDocuments({
      status: 'active'
    });

    // Recent donations (IMPORTANT FIX)
    const recentDonations = await Donor.find({ userId })
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = {
      totalDonations,
      pendingDonations,
      completedDonations,
      activeCampaigns,
      totalAmount
    };

    res.render('donor/donorDashboard', {
      user: {
        _id: req.user._id,
        role: req.user.role,
        name: req.user.name
      },
      stats,
      recentDonations
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};


// ===============================
// DONATION FORM
// ===============================
exports.donationForm = async (req, res) => {
  try {
    const campaignId = req.params.campaignId;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.send('Invalid campaign ID');
    }

    const campaign = await Campaign.findById(campaignId);

    if (!campaign || campaign.status !== 'active') {
      return res.send('Campaign not available for donation');
    }

    res.render('donor/donationForm', { campaign });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};


// ===============================
// ADD DONATION
// ===============================
exports.addDonation = async (req, res) => {
  try {
    const { campaignId, amount, description } = req.body;
    const amountNumber = Number(amount);

    // Validation
    if (!campaignId || !amountNumber || amountNumber <= 0) {
      return res.status(400).send("Invalid donation amount");
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).send("Invalid campaign ID");
    }

    // Check campaign exists + active
    const campaign = await Campaign.findById(campaignId);

    if (!campaign || campaign.status !== 'active') {
      return res.status(400).send("Campaign not available");
    }

    // Create donation
    const donation = new Donor({
      userId: req.user._id,
      campaignId,
      amount: amountNumber,
      description,
      status: 'completed'
    });

    await donation.save();

    // Update campaign raised amount (CACHE update)
    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { raised: amountNumber }
    });

    setMessage(req, "success", "Donation successfully made.");
    return res.redirect('/donor/dashboard');

  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
      setMessage(req, "error", "Donation failed. Please try again.");
      return res.redirect('/donor/dashboard');
  }
};


