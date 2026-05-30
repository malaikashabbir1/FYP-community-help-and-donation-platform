const Donation = require('../models/donation');
const Campaign = require('../models/campaign');
const mongoose = require('mongoose');
const { setMessage } = require('../utils/flashMessage');


// ==========================
// DONOR DASHBOARD
// ==========================
exports.getDonorDashboard = async (req, res) => {
  try {

    const userId = req.user._id;

    // 1. TOTAL DONATIONS COUNT
    const totalDonations = await Donation.countDocuments({
      donor: userId
    });

    // 2. TOTAL AMOUNT
    const totalAmountResult = await Donation.aggregate([
      {
        $match: {
          donor: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    const totalAmount = totalAmountResult[0]?.total || 0;

    // 3. ACTIVE CAMPAIGNS
    const activeCampaigns = await Campaign.countDocuments({
      status: 'active'
    });

    // 4. RECENT DONATIONS
    const recentDonations = await Donation.find({
      donor: userId
    })
      .populate('campaign', 'name goal raised category subCategory')
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. AVERAGE DONATION
    const avgResult = await Donation.aggregate([
      {
        $match: {
          donor: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          avgAmount: { $avg: "$amount" }
        }
      }
    ]);

    const averageDonation = avgResult[0]?.avgAmount || 0;

    // 6. LAST DONATION
    const lastDonation = await Donation.findOne({
      donor: userId
    })
      .sort({ createdAt: -1 })
      .select('createdAt amount campaign');

    // 7. DONATION HISTORY
    const donationHistory = await Donation.find({
      donor: userId
    })
      .sort({ createdAt: -1 })
      .select('amount createdAt campaign');

    // 8. FREQUENCY CALCULATION
    const firstDonation = await Donation.findOne({
      donor: userId
    }).sort({ createdAt: 1 });

    const lastDonationDate = await Donation.findOne({
      donor: userId
    }).sort({ createdAt: -1 });

    let frequency = 0;

    if (firstDonation && lastDonationDate) {
      const daysActive =
        (lastDonationDate.createdAt - firstDonation.createdAt) /
        (1000 * 60 * 60 * 24);

      frequency = totalDonations / (daysActive || 1);
    }

    // ==========================
    // RENDER
    // ==========================
    res.render('donor/donorDashboard', {
      user: req.user
        ? {
            _id: req.user._id,
            role: req.user.role,
            name: req.user.name
          }
        : null,

      stats: {
        totalDonations,
        activeCampaigns,
        totalAmount,
        averageDonation,
        frequency
      },

      recentDonations,
      lastDonation,
      donationHistory
    });

  } catch (err) {
    console.error('Donor Dashboard Error:', err);
    res.status(500).send('Server Error');
  }
};


// ==========================
// DONATION FORM
// ==========================
exports.donationForm = async (req, res) => {
  try {

    const campaignId = req.params.campaignId;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      setMessage(req, "error", "Invalid campaign ID.");
      return res.redirect('/donor/dashboard');
    }

    const campaign = await Campaign.findById(campaignId);

    if (
      !campaign ||
      campaign.status !== 'active' ||
      campaign.raised >= campaign.goal
    ) {
      setMessage(req, "error", "Campaign not available for donation.");
      return res.redirect('/campaigns/live');
    }

    const updatedCampaign = {
      ...campaign.toObject(),
      remaining: Math.max(0, campaign.goal - campaign.raised)
    };

    res.render('donor/donationForm', {
      campaign: updatedCampaign
    });

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Server error.");
    return res.redirect('/donor/dashboard');
  }
};