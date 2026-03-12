const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['donor', 'volunteer', 'admin'], //only one option is valid
    default: 'donor'
  },
  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending'
  }
},
   { timestamps: true }); //automatically adds createdAt and updatedAt (date&time)

// Prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Export the model
module.exports = User;
