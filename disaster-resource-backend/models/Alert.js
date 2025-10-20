const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['fraud', 'shortage', 'system', 'security', 'delivery_delay'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedResource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  },
  relatedRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  relatedDelivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryTask'
  },
  status: {
    type: String,
    enum: ['new', 'investigating', 'resolved', 'dismissed'],
    default: 'new'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolution: String
}, {
  timestamps: true
});

// Index for efficient queries
alertSchema.index({ type: 1, status: 1, severity: 1 });
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
