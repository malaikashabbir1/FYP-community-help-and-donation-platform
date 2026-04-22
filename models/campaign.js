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
    enum: ['draft', 'active', 'completed'],
    default: 'draft'
  }

}, { timestamps: true });

module.exports = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);