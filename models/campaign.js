const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },

  description: { 
    type: String 
  },

  goal: { 
    type: Number, 
    required: true,
    min: 100,
    max: 10000000 
  },

  raised: { 
    type: Number, 
    default: 0 
  },
  

  image: { 
    type: String 
  },

  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'rejected', 'completed'],
    default: 'draft'
  },

  rejectionReason: {
    type: String,
    default: ""
  },

  reviewedAt: {
    type: Date,
    default: null
  },
  
  // CAMPAIGN OWNERSHIP
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // volunteers
  requiredVolunteers: {
  type: Number,
  default: 0
},

volunteers: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}],

location: String,

urgency: {
  type: String,
  enum: ['low', 'medium', 'high', 'emergency'],
  default: 'medium'
},

updates: [{
  text: String,
  createdAt: { type: Date, default: Date.now }
}]

}, { timestamps: true });

module.exports = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);