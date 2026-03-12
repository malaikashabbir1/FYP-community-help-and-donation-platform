const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  type: { type: String, required: true },          // e.g., 'user', 'donation', 'volunteer'
  refId: { type: mongoose.Schema.Types.ObjectId, required: true }, // reference to the entity
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who did it
  description: { type: String, required: true },  // e.g., 'John donated $50'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);

;