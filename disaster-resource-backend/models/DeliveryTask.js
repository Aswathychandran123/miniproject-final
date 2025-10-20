// models/DeliveryTask.js
const mongoose = require('mongoose');

const deliveryTaskSchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  status: { 
    type: String, 
    enum: ['assigned', 'accepted', 'picked-up', 'in-transit', 'delivered', 'in-progress', 'completed'], 
    default: 'assigned' 
  },
  
  // Timestamps for each status
  acceptedAt: Date,
  pickedUpAt: Date,
  inTransitAt: Date,
  startedAt: Date,
  completedAt: Date,
  actualDeliveryTime: Date,
  
  // Live location tracking (Swiggy-style)
  liveLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    timestamp: Date
  },
  
  // Location history for tracking route
  locationHistory: [{
    coordinates: [Number],
    timestamp: Date,
    status: String
  }],
  
  // Status change history
  statusHistory: [{
    status: String,
    timestamp: Date,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  }],
  
  // estimated delivery time
  estimatedDeliveryTime: Date,
  
}, { timestamps: true });

// Index for geospatial queries
deliveryTaskSchema.index({ 'liveLocation': '2dsphere' });

module.exports = mongoose.model('DeliveryTask', deliveryTaskSchema);