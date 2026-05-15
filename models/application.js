const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Campaign",
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  message: {
    type: String,
    required: true
  },


  phone: {
    type: String,
    required: true
  },

  availability: {
    type: String,
    enum: ["full-time", "part-time", "weekends"],
    default: "part-time"
  },

  skills: String,


}, { timestamps: true });

// prevent duplicate applications
applicationSchema.index({ user: 1, campaign: 1 }, { unique: true });

module.exports =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);