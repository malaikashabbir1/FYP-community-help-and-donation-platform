const allowedTransitions = {
  draft: ['active', 'rejected'],
  active: ['completed'],
  rejected: [],
  completed: []
};

function canChangeStatus(currentStatus, newStatus) {
  const allowed = allowedTransitions[currentStatus] || [];
  return allowed.includes(newStatus);
}

module.exports = { canChangeStatus };