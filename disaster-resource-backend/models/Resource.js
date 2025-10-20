// models/Resource.js
const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // e.g., food, water, medicine
  quantity: { type: Number, required: true }, // Current available quantity
  originalQuantity: { type: Number }, // Original donated quantity (optional for backward compatibility)
  description: { type: String },
  location: { type: String, default: 'Not specified' }, // Simple text address
  status: { type: String, enum: ['available', 'requested', 'delivered'], default: 'available' },
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);