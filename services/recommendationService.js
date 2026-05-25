const Campaign = require('../models/campaign');
const Donation = require('../models/donation');
const Application = require('../models/application');


// ================== PERSONALIZED (OLD USERS) ==================
const getPersonalizedRecommendations = async (user) => {
  const campaigns = await Campaign.find({ status: "active" });

  const donations = await Donation.find({ donor: user._id });
  const applications = await Application.find({ user: user._id });

  // Build category interest from donations
  const categoryInterest = {};

  donations.forEach(d => {
    if (!d.category) return;
    categoryInterest[d.category] =
      (categoryInterest[d.category] || 0) + 1;
  });

  const hasInterest = Object.keys(categoryInterest).length > 0;

  // Applied campaigns set
  const appliedCampaigns = new Set(
    applications.map(a => a.campaign?.toString()).filter(Boolean)
  );

  const scored = campaigns.map(c => {
    let score = 0;
    const id = c._id.toString();

    // 1. Category preference (strong signal)
    if (hasInterest && categoryInterest[c.category]) {
      score += categoryInterest[c.category] * 35;
    } else {
      // fallback so results don’t collapse
      score += 3;
    }

    // 2. Strong intent boost (applications)
    if (appliedCampaigns.has(id)) {
      score += 60;
    }

    // 3. Popularity signals (reduced weight)
    score += (c.donorCount || 0) * 0.5;
    score += (c.raisedAmount || 0) / 6000;

    // 4. Recency boost
    const daysOld =
      (Date.now() - new Date(c.createdAt)) /
      (1000 * 60 * 60 * 24);

    if (daysOld <= 7) score += 25;
    else if (daysOld <= 30) score += 10;

    // 🔥 5. DIVERSITY BOOST (IMPORTANT)
    score += Math.random() * 2;

    return { ...c._doc, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};


// ================== TRENDING (NEW USERS) ==================
const getTrendingRecommendations = async () => {
  const campaigns = await Campaign.find({ status: "active" });

  const applicationAgg = await Application.find({ status: "approved" });

  const applicationScore = {};

  applicationAgg.forEach(app => {
    if (!app?.campaign) return;

    const id = app.campaign.toString();
    applicationScore[id] =
      (applicationScore[id] || 0) + 5;
  });

  const scored = campaigns.map(c => {
    let score = 0;
    const id = c._id.toString();

    // popularity (reduced dominance)
    score += (c.donorCount || 0) * 6;
    score += (c.raisedAmount || 0) / 2500;

    // applications boost
    if (applicationScore[id]) {
      score += applicationScore[id] * 6;
    }

    // recency boost
    const daysOld =
      (Date.now() - new Date(c.createdAt)) /
      (1000 * 60 * 60 * 24);

    if (daysOld <= 7) score += 30;
    else if (daysOld <= 30) score += 15;

    // 🔥 DIVERSITY BOOST
    score += Math.random() * 3;

    return { ...c._doc, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};


module.exports = {
  getPersonalizedRecommendations,
  getTrendingRecommendations
};