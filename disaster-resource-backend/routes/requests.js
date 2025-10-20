// routes/requests.js
const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Request = require('../models/Request');
const { smartResourceMatch, smartVolunteerMatch } = require('../utils/smartMatching');
const DeliveryTask = require('../models/DeliveryTask');
const router = express.Router();

// Create a request (requester only) with SMART automatic matching
router.post('/', authMiddleware, roleMiddleware(['requester']), async (req, res) => {
  const { resourceType, quantity, urgency, location } = req.body;
  try {
    const request = new Request({
      requester: req.user._id,
      resourceType,
      quantity,
      urgency,
      location: location || 'Not specified',
    });
    await request.save();

    console.log('\n🔍 SMART MATCHING INITIATED');
    console.log(`Request: ${resourceType} x${quantity} | Urgency: ${urgency}`);

    // SMART RESOURCE MATCHING
    const resourceMatch = await smartResourceMatch(request);

    if (resourceMatch) {
      console.log(`\n✅ Resource matched with score: ${resourceMatch.score.toFixed(2)}/100`);
      
      const matchedResource = resourceMatch.resource;

      // SMART VOLUNTEER MATCHING
      const volunteerMatch = await smartVolunteerMatch(matchedResource, request);

      if (volunteerMatch) {
        console.log(`\n✅ Volunteer matched with score: ${volunteerMatch.score.toFixed(2)}/100`);
        
        const volunteer = volunteerMatch.volunteer;

        // Create delivery task
        const deliveryTask = new DeliveryTask({
          volunteer: volunteer._id,
          request: request._id,
          resource: matchedResource._id,
          status: 'assigned'
        });
        await deliveryTask.save();

        // Update request and resource
        request.assignedVolunteer = volunteer._id;
        request.assignedResource = matchedResource._id;
        await request.save();

        // Reduce donated quantity by request quantity
        const originalQuantity = matchedResource.quantity;
        matchedResource.quantity -= request.quantity;
        
        // If donation quantity becomes 0 or less, mark as delivered
        if (matchedResource.quantity <= 0) {
          matchedResource.status = 'delivered';
          matchedResource.quantity = 0;
        }
        // If still has quantity, keep it available for other requests
        // Status remains 'available' so it can be matched again
        
        await matchedResource.save();

        console.log(`📦 Donation quantity reduced: ${originalQuantity} → ${matchedResource.quantity}`);

        // Send real-time notification
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

        console.log(`\n🎉 SMART MATCHING COMPLETE!`);
        console.log(`Resource: ${matchedResource.type} from ${matchedResource.donor.name}`);
        console.log(`Volunteer: ${volunteer.name} (Rating: ${volunteer.rating.toFixed(1)}⭐)`);
        console.log(`Match Quality: ${((resourceMatch.score + volunteerMatch.score) / 2).toFixed(2)}/100\n`);

        // Populate the request before sending response
        await request.populate('assignedVolunteer', 'name email');
        await request.populate('assignedResource');

        res.json({
          ...request.toObject(),
          matchingInfo: {
            resourceScore: resourceMatch.score,
            volunteerScore: volunteerMatch.score,
            overallQuality: ((resourceMatch.score + volunteerMatch.score) / 2).toFixed(2),
            resourceBreakdown: resourceMatch.breakdown,
            volunteerBreakdown: volunteerMatch.breakdown
          }
        });
      } else {
        console.log('\n⚠️ No available volunteers found');
        res.json(request);
      }
    } else {
      console.log('\n⚠️ No matching resources found');
      res.json(request);
    }
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all requests (authenticated users get their own, public gets pending only)
router.get('/', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Authenticated user - check if they want their own requests
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.userId);
        
        if (user && user.role === 'requester') {
          // Return ALL requests for this requester (including fulfilled)
          const requests = await Request.find({ requester: user._id })
            .populate('requester', 'name location')
            .populate('assignedVolunteer', 'name')
            .populate('assignedResource')
            .sort({ createdAt: -1 });
          return res.json(requests);
        }
      } catch (err) {
        // Invalid token, fall through to public view
      }
    }
    
    // Public view - only pending requests
    const requests = await Request.find({ status: 'pending' }).populate('requester', 'name location');
    res.json(requests);
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get request by ID
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('requester', 'name location')
      .populate('assignedVolunteer', 'name')
      .populate('assignedResource');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    console.error('Get request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request status (authenticated users)
router.patch('/:id', authMiddleware, async (req, res) => {
  const { status, assignedVolunteer, assignedResource } = req.body;
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (status) request.status = status;
    if (assignedVolunteer) request.assignedVolunteer = assignedVolunteer;
    if (assignedResource) request.assignedResource = assignedResource;

    await request.save();
    res.json(request);
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
