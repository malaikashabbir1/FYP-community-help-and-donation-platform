// ____________________________ For Donations ________________________________
const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  campaignId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Campaign', 
    required: true 
  },

  amount: { 
    type: Number, 
    required: true,
    min: 1
  },

  description: { 
    type: String 
  },

  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'completed'
  }

}, { timestamps: true });

module.exports = mongoose.models.Donor || mongoose.model('Donor', donorSchema);