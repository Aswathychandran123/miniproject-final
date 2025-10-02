// models/Resource.js
const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
  type: { type: String, required: true }, // e.g., food, water, medicine
  quantity: { type: Number, required: true },
  description: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  status: { type: String, enum: ['available', 'requested', 'delivered'], default: 'available' },
}, { timestamps: true });

resourceSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Resource', resourceSchema);