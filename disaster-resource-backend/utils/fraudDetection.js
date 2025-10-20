const Alert = require('../models/Alert');
const User = require('../models/User');
const Request = require('../models/Request');
const Resource = require('../models/Resource');
const DeliveryTask = require('../models/DeliveryTask');

// Fraud detection utility functions
const fraudDetection = {
  
  // Check for suspicious user activity
  async checkSuspiciousActivity(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const alerts = [];
      const now = new Date();
      const last24Hours = new Date(now - 24 * 60 * 60 * 1000);

      // Check 1: Multiple failed deliveries
      if (user.role === 'volunteer') {
        const recentTasks = await DeliveryTask.find({
          volunteer: userId,
          createdAt: { $gte: last24Hours }
        });

        const failedTasks = recentTasks.filter(t => t.status === 'rejected' || t.status === 'cancelled');
        
        if (failedTasks.length >= 3) {
          alerts.push({
            type: 'fraud',
            severity: 'high',
            title: 'Multiple Failed Deliveries',
            message: `Volunteer ${user.name} has ${failedTasks.length} failed deliveries in the last 24 hours`,
            relatedUser: userId,
            metadata: { failedCount: failedTasks.length }
          });
        }
      }

      // Check 2: Excessive requests from requester
      if (user.role === 'requester') {
        const recentRequests = await Request.find({
          requester: userId,
          createdAt: { $gte: last24Hours }
        });

        if (recentRequests.length >= 10) {
          alerts.push({
            type: 'fraud',
            severity: 'medium',
            title: 'Excessive Resource Requests',
            message: `User ${user.name} has submitted ${recentRequests.length} requests in 24 hours`,
            relatedUser: userId,
            metadata: { requestCount: recentRequests.length }
          });
        }
      }

      // Check 3: Duplicate resources from donor
      if (user.role === 'donor') {
        const recentResources = await Resource.find({
          donor: userId,
          createdAt: { $gte: last24Hours }
        });

        // Check for duplicate descriptions
        const descriptions = recentResources.map(r => r.description?.toLowerCase());
        const duplicates = descriptions.filter((item, index) => descriptions.indexOf(item) !== index);
        
        if (duplicates.length >= 3) {
          alerts.push({
            type: 'fraud',
            severity: 'medium',
            title: 'Duplicate Resource Listings',
            message: `Donor ${user.name} has posted ${duplicates.length} duplicate resources`,
            relatedUser: userId,
            metadata: { duplicateCount: duplicates.length }
          });
        }
      }

      // Check 4: Low rating with high activity
      if (user.rating < 2.5 && user.ratingCount >= 5) {
        alerts.push({
          type: 'fraud',
          severity: 'high',
          title: 'Low Rating Alert',
          message: `User ${user.name} has consistently low rating (${user.rating}/5) with ${user.ratingCount} reviews`,
          relatedUser: userId,
          metadata: { rating: user.rating, ratingCount: user.ratingCount }
        });
      }

      // Save alerts to database
      for (const alertData of alerts) {
        const existingAlert = await Alert.findOne({
          type: alertData.type,
          relatedUser: userId,
          status: { $in: ['new', 'investigating'] },
          createdAt: { $gte: last24Hours }
        });

        if (!existingAlert) {
          await Alert.create(alertData);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error in fraud detection:', error);
      return null;
    }
  },

  // Check for delivery delays
  async checkDeliveryDelays() {
    try {
      const now = new Date();
      const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);

      const delayedDeliveries = await DeliveryTask.find({
        status: { $in: ['accepted', 'picked-up', 'in-transit'] },
        acceptedAt: { $lte: twoHoursAgo }
      }).populate('volunteer request');

      const alerts = [];

      for (const delivery of delayedDeliveries) {
        const existingAlert = await Alert.findOne({
          type: 'delivery_delay',
          relatedDelivery: delivery._id,
          status: { $in: ['new', 'investigating'] }
        });

        if (!existingAlert) {
          alerts.push({
            type: 'delivery_delay',
            severity: 'medium',
            title: 'Delivery Delay Detected',
            message: `Delivery task ${delivery._id} has been in progress for over 2 hours`,
            relatedDelivery: delivery._id,
            relatedUser: delivery.volunteer?._id,
            metadata: {
              status: delivery.status,
              acceptedAt: delivery.acceptedAt,
              hoursDelayed: Math.floor((now - delivery.acceptedAt) / (60 * 60 * 1000))
            }
          });
        }
      }

      // Save alerts
      for (const alertData of alerts) {
        await Alert.create(alertData);
      }

      return alerts;
    } catch (error) {
      console.error('Error checking delivery delays:', error);
      return [];
    }
  },

  // Check for resource shortages
  async checkResourceShortages() {
    try {
      const resources = await Resource.aggregate([
        { $match: { status: 'available' } },
        { $group: { _id: '$type', totalQuantity: { $sum: '$quantity' } } }
      ]);

      const requests = await Request.aggregate([
        { $match: { status: { $in: ['pending', 'assigned'] } } },
        { $group: { _id: '$resourceType', totalQuantity: { $sum: '$quantity' } } }
      ]);

      const alerts = [];
      const resourceMap = {};
      
      resources.forEach(r => {
        resourceMap[r._id] = { available: r.totalQuantity, requested: 0 };
      });

      requests.forEach(r => {
        if (!resourceMap[r._id]) {
          resourceMap[r._id] = { available: 0, requested: 0 };
        }
        resourceMap[r._id].requested = r.totalQuantity;
      });

      // Check for shortages
      for (const [type, data] of Object.entries(resourceMap)) {
        if (data.requested > data.available) {
          const deficit = data.requested - data.available;
          
          const existingAlert = await Alert.findOne({
            type: 'shortage',
            'metadata.resourceType': type,
            status: { $in: ['new', 'investigating'] },
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          });

          if (!existingAlert) {
            alerts.push({
              type: 'shortage',
              severity: deficit > data.available * 2 ? 'critical' : 'high',
              title: `${type} Shortage Detected`,
              message: `Critical shortage: ${deficit} units of ${type} needed (Available: ${data.available}, Requested: ${data.requested})`,
              metadata: {
                resourceType: type,
                available: data.available,
                requested: data.requested,
                deficit: deficit
              }
            });
          }
        }
      }

      // Save alerts
      for (const alertData of alerts) {
        await Alert.create(alertData);
      }

      return alerts;
    } catch (error) {
      console.error('Error checking resource shortages:', error);
      return [];
    }
  },

  // Run all fraud detection checks
  async runAllChecks() {
    try {
      const results = {
        deliveryDelays: await this.checkDeliveryDelays(),
        shortages: await this.checkResourceShortages(),
        timestamp: new Date()
      };

      console.log('Fraud detection checks completed:', {
        deliveryDelays: results.deliveryDelays.length,
        shortages: results.shortages.length
      });

      return results;
    } catch (error) {
      console.error('Error running fraud detection checks:', error);
      return null;
    }
  }
};

module.exports = fraudDetection;
