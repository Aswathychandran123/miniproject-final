// routes/resources.js
const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Resource = require('../models/Resource');
const Request = require('../models/Request');
const DeliveryTask = require('../models/DeliveryTask');
const { smartVolunteerMatch } = require('../utils/smartMatching');
const router = express.Router();

// Add resource (donor only) with AUTOMATIC MATCHING
router.post('/', authMiddleware, roleMiddleware(['donor']), async (req, res) => {
  const { type, quantity, description, location } = req.body;
  try {
    const resource = new Resource({
      donor: req.user._id,
      type,
      quantity,
      originalQuantity: quantity, // Store original quantity
      description,
      location: location || 'Not specified',
    });
    await resource.save();

    console.log('\n🔍 DONATION RECEIVED - CHECKING FOR MATCHING REQUESTS');
    console.log(`Resource: ${type} x${quantity}`);

    // Find matching pending requests (case-insensitive)
    const matchingRequests = await Request.find({
      resourceType: { $regex: new RegExp(`^${type}$`, 'i') }, // Case-insensitive match
      status: 'pending',
      assignedVolunteer: null,
      quantity: { $lte: quantity } // Request quantity should be <= donation quantity
    })
      .populate('requester', 'name location')
      .sort({ urgency: -1, createdAt: 1 }); // Prioritize high urgency and older requests

    if (matchingRequests.length > 0) {
      console.log(`✅ Found ${matchingRequests.length} matching request(s)`);
      
      // Match with the first (highest priority) request
      const request = matchingRequests[0];
      
      // Find best volunteer
      const volunteerMatch = await smartVolunteerMatch(resource, request);

      if (volunteerMatch) {
        const volunteer = volunteerMatch.volunteer;
        console.log(`✅ Volunteer matched: ${volunteer.name} (Score: ${volunteerMatch.score.toFixed(2)}/100)`);

        // Create delivery task
        const deliveryTask = new DeliveryTask({
          volunteer: volunteer._id,
          request: request._id,
          resource: resource._id,
          status: 'assigned'
        });
        await deliveryTask.save();

        // Update request and resource
        request.assignedVolunteer = volunteer._id;
        request.assignedResource = resource._id;
        await request.save();

        // Reduce donated quantity by request quantity
        const originalQuantity = resource.quantity;
        resource.quantity -= request.quantity;
        
        // If donation quantity becomes 0 or less, mark as delivered
        if (resource.quantity <= 0) {
          resource.status = 'delivered';
          resource.quantity = 0;
        }
        // If still has quantity, keep it available for other requests
        // Status remains 'available' so it can be matched again
        
        await resource.save();

        console.log(`📦 Donation quantity reduced: ${originalQuantity} → ${resource.quantity}`);

        // Send real-time notification to volunteer
        const io = req.app.get('io');
        if (io) {
          const taskDetails = await DeliveryTask.findById(deliveryTask._id)
            .populate('request', 'resourceType quantity location urgency')
            .populate('resource', 'type quantity location')
            .populate({
              path: 'request',
              populate: { path: 'requester', select: 'name' }
            })
            .populate({
              path: 'resource',
              populate: { path: 'donor', select: 'name location' }
            });

          io.to(volunteer._id.toString()).emit('newDeliveryTask', taskDetails);
        }

        console.log(`🎉 DONATION MATCHED! Task assigned to ${volunteer.name}\n`);

        return res.json({
          ...resource.toObject(),
          matchingInfo: {
            matched: true,
            request: request.resourceType,
            volunteer: volunteer.name,
            score: volunteerMatch.score
          }
        });
      } else {
        console.log('⚠️ No available volunteers found');
      }
    } else {
      console.log('⚠️ No matching pending requests found\n');
    }

    res.json(resource);
  } catch (err) {
    console.error('Add resource error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all resources (returns all for authenticated users, only available for public)
router.get('/', async (req, res) => {
  try {
    // If user is authenticated, return all their resources
    // Otherwise, return only available resources
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Authenticated user - return all resources
      const resources = await Resource.find().populate('donor', 'name location').sort({ createdAt: -1 });
      res.json(resources);
    } else {
      // Public access - only available resources with quantity > 0
      const resources = await Resource.find({ 
        quantity: { $gt: 0 },
        status: 'available'
      }).populate('donor', 'name location').sort({ createdAt: -1 });
      res.json(resources);
    }
  } catch (err) {
    console.error('Get resources error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Migration endpoint - Fix existing resources without originalQuantity
router.patch('/migrate/original-quantity', authMiddleware, async (req, res) => {
  try {
    const resources = await Resource.find({ originalQuantity: { $exists: false } });
    
    let updated = 0;
    for (const resource of resources) {
      resource.originalQuantity = resource.quantity;
      await resource.save();
      updated++;
    }
    
    res.json({ 
      message: `Migration complete. Updated ${updated} resources.`,
      updated 
    });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;