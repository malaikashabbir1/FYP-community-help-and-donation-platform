const Donation = require('../models/donation');


// ================= LIST DONATIONS =================
exports.getAllDonations = async (req, res) => {
  try {

    const { search = '' } = req.query;

    let donations;

    if (search) {

      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      donations = await Donation.find()
        .populate({
          path: 'donor',
          match: { name: { $regex: safeSearch, $options: 'i' } }
        })
        .populate('campaign', 'name goal raised')
        .sort({ createdAt: -1 });

      donations = donations.filter(d => d.donor);

    } else {

      donations = await Donation.find()
        .populate('donor', 'name _id')
        .populate('campaign', 'name goal raised')
        .sort({ createdAt: -1 });

    }

    const totalDonations = donations.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    );

    const totalDonors = new Set(
      donations
        .map(d => d.donor?._id?.toString())
        .filter(Boolean)
    ).size;

    const avgDonation = donations.length
      ? totalDonations / donations.length
      : 0;

    res.render('admin/donations/list', {
      donations,
      totalDonations,
      totalDonors,
      avgDonation,
      search
    });

  } catch (err) {
    console.log(err);
    res.redirect('/admin/dashboard');
  }
};


// ================= DONATION DETAILS =================
exports.getDonationDetails = async (req, res) => {
  try {

    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email')
      .populate('campaign', 'name goal raised');

    if (!donation) {
      return res.redirect('/admin/donations');
    }

    res.render('admin/donations/detail', {
      donation
    });

  } catch (err) {
    console.log("Donation Detail Error:", err);
    res.redirect('/admin/donations');
  }
};


// ================= DONATION SUMMARY =================
exports.getDonationSummary = async (req, res) => {
  try {

    const donations = await Donation.find()
      .populate('campaign', 'name goal raised')
      .populate('donor', 'name _id');

    const summaryMap = {};

    donations.forEach(d => {

      const id = d.campaign?._id?.toString();
      if (!id || !d.campaign) return;

      if (!summaryMap[id]) {
        summaryMap[id] = {
          name: d.campaign.name,
          goal: d.campaign.goal || 0,
          raised: 0,
          donors: new Set()
        };
      }

      summaryMap[id].raised += d.amount || 0;

      if (d.donor?._id) {
        summaryMap[id].donors.add(d.donor._id.toString());
      }
    });

    const summary = Object.values(summaryMap).map(c => ({
      name: c.name,
      goal: c.goal,
      raised: c.raised,
      donorCount: c.donors.size
    }));

    res.render('admin/donations/summary', { summary });

  } catch (err) {
    console.log(err);
    res.redirect('/admin/donations');
  }
};