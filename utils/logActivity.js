const ActivityLog = require('../models/activityLog');

const logActivity = async ({ type, refId, userId, description }) => {
  try {
    await ActivityLog.create({
      type,
      refId,
      userId,
      description
    });
  } catch (err) {
    console.error("ActivityLog error:", err.message);
  }
};

module.exports = logActivity;