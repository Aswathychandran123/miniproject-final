// models/Dispute.js
const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  deliveryTask: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryTask', required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedAgainst: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: ['delivery_failed', 'incomplete_delivery', 'quality_issue', 'behavior_issue', 'other'], 
    required: true 
  },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['open', 'investigating', 'resolved', 'closed'], 
    default: 'open' 
  },
  resolution: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
