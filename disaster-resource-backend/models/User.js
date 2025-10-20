// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'requester', 'volunteer', 'admin'], required: true },
  location: { type: String, default: 'Not specified' }, // Simple text address
  availability: { type: Boolean, default: true }, // for volunteers
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  // Admin approval fields
  isApproved: { type: Boolean, default: true }, // Auto-approved by default
  isActive: { type: Boolean, default: true },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'verified' 
  },
  phone: { type: String },
  address: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);