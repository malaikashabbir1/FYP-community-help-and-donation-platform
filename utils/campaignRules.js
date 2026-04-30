const allowedTransitions = {
  draft: ['pending'],
  pending: ['active', 'rejected'],
  active: ['completed'],
  rejected: ['draft'],
  completed: []
};

function canChangeStatus(currentStatus, newStatus) {
  const allowed = allowedTransitions[currentStatus] || [];
  return allowed.includes(newStatus);
}

module.exports = { canChangeStatus };