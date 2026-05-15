const Campaign = require('../models/campaign');
const Application = require('../models/application');

async function checkAndCompleteCampaign(campaignId) {

  const campaign = await Campaign.findById(campaignId);

  if (!campaign) return null;

  // ✅ COUNT ONLY APPROVED APPLICATIONS (NEW SYSTEM)
  const approvedApplications = await Application.countDocuments({
    campaign: campaign._id,
    status: "approved"
  });

  // 🧠 FINAL BUSINESS RULE
  const isEligible =
    campaign.raised >= campaign.goal &&
    approvedApplications >= campaign.requiredVolunteers;

  // 🟢 COMPLETE CAMPAIGN
  if (isEligible && campaign.status !== "completed") {

    campaign.status = "completed";

    // ensure fully funded
    campaign.raised = campaign.goal;

    // optional tracking field
    campaign.completedAt = new Date();

    await campaign.save();
  }

  return campaign;
}

module.exports = { checkAndCompleteCampaign };