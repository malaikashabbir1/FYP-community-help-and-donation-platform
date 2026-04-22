const User = require('../models/user'); // If you want to fetch additional user info
const Donor = require('../models/donor');
const Campaign = require('../models/campaign');
const mongoose = require('mongoose');

// Donor's Dashboard
exports.getDonorDashboard = async (req, res) => {
  try {

    const userId = req.user.id;

    const totalDonations = await Donor.countDocuments({ userId });

    const pendingDonations = await Donor.countDocuments({
      userId,
      status: 'pending'
    });

    const completedDonations = await Donor.countDocuments({
      userId,
      status: 'completed'
    });

    const activeCampaigns = await Campaign.countDocuments();

    const stats = {
      totalDonations,
      pendingDonations,
      completedDonations,
      activeCampaigns
    };

    res.render('donor/donorDashboard', {
      user: req.user,
      stats
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// Showing the campaignList
exports.campaignsList = async (req, res) => {
  try {
    const campaigns = await Campaign.find();
    res.render('donor/campaigns-list', { campaigns });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// Donation Form Page 
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

    // Validate input
    if (!campaignId || !amountNumber || amountNumber <= 0) {
      return res.status(400).send("Invalid donation");
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.send("Invalid campaign ID");
    }

    // Save donation
    const donation = new Donor({
      userId: req.user.id,
      campaignId,
      amount: amountNumber,
      description
    });

    await donation.save();

    // Update campaign raised amount
    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { raised: amountNumber }
    });

    res.redirect('/donor/campaigns');

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};