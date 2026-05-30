const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({

  // =====================
  // BASIC INFO
  // =====================
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: String,
  image: String,

  // =====================
  // STRUCTURED AI LAYER
  // =====================

  category: {
    type: String,
    enum: [
      'healthcare',
      'education',
      'emergency',
      'social',
      'animal_welfare',
      'charity'
    ],
    required: true,
    index: true
  },

  subCategory: {
    type: String,
    enum: [
      // healthcare
      'cancer_treatment',
      'surgery',
      'emergency_care',
      'chronic_illness',
      'medical_equipment',

      // education
      'scholarship',
      'school_funding',
      'skill_training',

      // emergency
      'flood_relief',
      'earthquake_relief',
      'fire_relief',

      // social
      'poverty_relief',
      'orphan_support',
      'elderly_care',
      'clean_water_project',
      'clothing_distribution',
      'basic_needs_support',
      'tree_plantation',
      'community_development',

      // animal
      'animal_rescue',

      'other'
    ],
    default: 'basic_needs_support'
  },

  // =====================
  // FLEXIBLE AI LAYER (IMPORTANT)
  // =====================
  tags: {
    type: [String],
    default: [],
    index: true
  },

  // =====================
  // FUNDING
  // =====================
  goal: {
    type: Number,
    required: true, 
    min: 100
  },

  raised: {
    type: Number,
    default: 0
  },

  donationCount: {
    type: Number,
    default: 0
  },

  // =====================
  // STATUS
  // =====================
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

  // =====================
  // OWNERSHIP
  // =====================
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

  // =====================
  // EXTRA CONTEXT
  // =====================
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

module.exports =
  mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);