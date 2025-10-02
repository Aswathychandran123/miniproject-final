// models/Request.js
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
  resourceType: { type: String, required: true },
  quantity: { type: Number, required: true },
  urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  status: { type: String, enum: ['pending', 'fulfilled', 'rejected'], default: 'pending' },
  assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User ' },
  assignedResource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
}, { timestamps: true });

requestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Request', requestSchema);