const User = require('../models/user');
const Donor = require('../models/donor');
const Campaign = require('../models/campaign');
const mongoose = require('mongoose');

// Donor Dashboard
exports.getDonorDashboard = async (req, res) => {
  try {

    // 🔥 FIX: use _id instead of id
    const userId = req.user._id;

    const totalDonations = await Donor.countDocuments({ userId });

    const pendingDonations = await Donor.countDocuments({
      userId,
      status: 'pending'
    });

    const completedDonations = await Donor.countDocuments({
      userId,
      status: 'completed'
    });

    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });

    const stats = {
      totalDonations,
      pendingDonations,
      completedDonations,
      activeCampaigns
    };

    res.render('donor/donorDashboard', {
      user: {
        _id: req.user._id,
        role: req.user.role,
        name: req.user.name
      },
      stats
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};


// Campaign list
exports.campaignsList = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'active' })
      .sort({ createdAt: -1 });

    res.render('donor/campaigns-list', { campaigns });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};


// Donation Form
exports.donationForm = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);

    if (!campaign) {
      return res.send('Campaign not found');
    }

    res.render('donor/donorDonationForm', { campaign });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};


// Add Donation
exports.addDonation = async (req, res) => {
  try {
    const { campaignId, amount, description } = req.body;
    const amountNumber = Number(amount);

    if (!campaignId || !amountNumber || amountNumber <= 0) {
      return res.status(400).send("Invalid donation");
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.send("Invalid campaign ID");
    }

    const donation = new Donor({
      userId: req.user._id, // 🔥 FIX HERE
      campaignId,
      amount: amountNumber,
      description
    });

    await donation.save();

    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { raised: amountNumber }
    });

    res.redirect('/donor/campaigns');

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};