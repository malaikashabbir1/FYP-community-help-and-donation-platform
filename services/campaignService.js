const Campaign = require('../models/campaign');
const { canCompleteCampaign } = require('../utils/campaignStatus');

async function checkAndCompleteCampaign(campaignId) {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) return null;

  const volunteersCount = campaign.volunteers.length;

  const isEligible =
    campaign.raised >= campaign.goal &&
    volunteersCount >= campaign.requiredVolunteers;

  if (isEligible && campaign.status !== "completed") {
    campaign.status = "completed";
    campaign.raised = campaign.goal;
    await campaign.save();
  }

  return campaign;
}

module.exports = { checkAndCompleteCampaign };