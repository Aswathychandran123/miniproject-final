// models/DeliveryTask.js
const mongoose = require('mongoose');

const deliveryTaskSchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  status: { type: String, enum: ['assigned', 'in-progress', 'completed'], default: 'assigned' },
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('DeliveryTask', deliveryTaskSchema);