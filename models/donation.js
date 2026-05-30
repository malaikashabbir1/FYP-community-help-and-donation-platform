const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({

  // USER (donor comes from User model)
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // CAMPAIGN reference
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true
  },

  // DONATION AMOUNT
  amount: {
    type: Number,
    required: true,
    min: 1
  },

  // IMPORTANT: when donation happened
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }

});

module.exports =
  mongoose.models.Donation || mongoose.model("Donation", donationSchema);