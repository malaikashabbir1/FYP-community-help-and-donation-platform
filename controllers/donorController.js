const Donation = require('../models/donation');
const Campaign = require('../models/campaign');
const mongoose = require('mongoose');
const { setMessage } = require('../utils/flashMessage');


// DONOR DASHBOARD

exports.getDonorDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // TOTAL DONATIONS (count by donor)
    const totalDonations = await Donation.countDocuments({ donor: userId });

    // PENDING DONATIONS
    const pendingDonations = await Donation.countDocuments({
      donor: userId,
      status: 'pending'
    });

    // COMPLETED DONATIONS
    const completedDonations = await Donation.countDocuments({
      donor: userId,
      status: 'completed'
    });

    // TOTAL DONATED AMOUNT
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

    const totalAmount =
      totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;

    // ACTIVE CAMPAIGNS (global)
    const activeCampaigns = await Campaign.countDocuments({
      status: 'active'
    });

    // RECENT DONATIONS (last 5)
    const recentDonations = await Donation.find({ donor: userId })
      .populate('campaign', 'name goal raised')
      .sort({ createdAt: -1 })
      .limit(5);

    // RENDER DASHBOARD
    res.render('donor/donorDashboard', {
      user: {
        _id: req.user._id,
        role: req.user.role,
        name: req.user.name
      },
      stats: {
        totalDonations,
        pendingDonations,
        completedDonations,
        activeCampaigns,
        totalAmount
      },
      recentDonations
    });

  } catch (err) {
    console.error('Donor Dashboard Error:', err);
    res.status(500).send('Server Error');
  }
};


// DONATION FORM (WITH REMAINING)
exports.donationForm = async (req, res) => {
  try {
    const campaignId = req.params.campaignId;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      setMessage(req, "error", "Invalid campaign ID.");
      return res.redirect('/donor/dashboard');
    }

    const campaign = await Campaign.findById(campaignId);

    //  SAFETY CHECK
    if (
      !campaign ||
      campaign.status !== 'active' ||
      campaign.raised >= campaign.goal
    ) {
      setMessage(req, "error", "Campaign not available for donation.");
      return res.redirect('/campaigns/live');
    }

    // ADD REMAINING
    const updatedCampaign = {
      ...campaign.toObject(),
      remaining: Math.max(0, campaign.goal - campaign.raised)
    };

    res.render('donor/donationForm', { campaign: updatedCampaign });

  } catch (err) {
    console.error(err);
    setMessage(req, "error", "Server error.");
    return res.redirect('/donor/dashboard');
  }
};