function canCompleteCampaign(campaign) {
  const volunteersCount = campaign.volunteers?.length || 0;
  const requiredVolunteers = campaign.requiredVolunteers || 0;

  return (
    campaign.raised >= campaign.goal &&
    volunteersCount >= requiredVolunteers
  );
}

function completeCampaignIfEligible(campaign) {
  if (canCompleteCampaign(campaign)) {
    campaign.raised = campaign.goal;
    campaign.status = "completed";
    return true;
  }
  return false;
}

module.exports = {
  canCompleteCampaign,
  completeCampaignIfEligible
};