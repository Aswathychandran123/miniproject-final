// routes/deliveryTasks.js
const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const DeliveryTask = require('../models/DeliveryTask');
const Request = require('../models/Request');
const Resource = require('../models/Resource');
const User = require('../models/User');
const router = express.Router();

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Find and assign volunteer to a request
async function findAndAssignVolunteer(request, resource, io) {
  try {
    // Find available volunteers
    const volunteers = await User.find({ 
      role: 'volunteer', 
      availability: true 
    });

    if (volunteers.length === 0) {
      console.log('No available volunteers found');
      return null;
    }

    // Find nearest volunteer to the donor's location
    let nearestVolunteer = null;
    let minDistance = Infinity;

    for (const volunteer of volunteers) {
      if (volunteer.location && volunteer.location.coordinates) {
        const distance = calculateDistance(
          resource.location.coordinates,
          volunteer.location.coordinates
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestVolunteer = volunteer;
        }
      }
    }

    if (!nearestVolunteer) {
      console.log('No volunteer with valid location found');
      return null;
    }

    // Create delivery task
    const deliveryTask = new DeliveryTask({
      volunteer: nearestVolunteer._id,
      request: request._id,
      resource: resource._id,
      status: 'assigned'
    });

    await deliveryTask.save();

    // Update request and resource status
    request.assignedVolunteer = nearestVolunteer._id;
    request.assignedResource = resource._id;
    await request.save();

    resource.status = 'requested';
    await resource.save();

    // Notify volunteer via Socket.IO
    if (io) {
      const taskDetails = await DeliveryTask.findById(deliveryTask._id)
        .populate('request', 'resourceType quantity location')
        .populate('resource', 'type quantity location')
        .populate({
          path: 'request',
          populate: { path: 'requester', select: 'name' }
        })
        .populate({
          path: 'resource',
          populate: { path: 'donor', select: 'name location' }
        });

      io.to(nearestVolunteer._id.toString()).emit('newDeliveryTask', taskDetails);
    }

    console.log(`Assigned volunteer ${nearestVolunteer.name} to delivery task`);
    return deliveryTask;
  } catch (err) {
    console.error('Error assigning volunteer:', err);
    return null;
  }
}

// Debug route - Get all tasks (temporary for debugging)
router.get('/debug/all', authMiddleware, async (req, res) => {
  try {
    const allTasks = await DeliveryTask.find()
      .populate('volunteer', 'name email')
      .populate('request', 'resourceType quantity')
      .populate('resource', 'type quantity');
    
    const volunteers = await User.find({ role: 'volunteer' }).select('name email availability location');
    const resources = await Resource.find().select('type quantity status');
    const requests = await Request.find().select('resourceType quantity status assignedVolunteer');
    
    res.json({
      totalTasks: allTasks.length,
      tasks: allTasks,
      totalVolunteers: volunteers.length,
      volunteers: volunteers,
      totalResources: resources.length,
      resources: resources,
      totalRequests: requests.length,
      requests: requests
    });
  } catch (err) {
    console.error('Debug all tasks error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all delivery tasks for logged-in user (volunteer or requester)
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('=== FETCHING TASKS ===');
    console.log('User:', req.user.name, 'Role:', req.user.role, 'ID:', req.user._id);
    
    let tasks = [];
    
    if (req.user.role === 'volunteer') {
      // Find tasks assigned to this volunteer
      tasks = await DeliveryTask.find({ 
        volunteer: req.user._id 
      })
        .populate('request', 'resourceType quantity urgency location')
        .populate('resource', 'type quantity description location')
        .populate({
          path: 'request',
          populate: { path: 'requester', select: 'name email' }
        })
        .populate({
          path: 'resource',
          populate: { path: 'donor', select: 'name email location' }
        })
        .sort({ createdAt: -1 });

      console.log(`Found ${tasks.length} tasks for volunteer ${req.user.name}`);
    } else if (req.user.role === 'requester') {
      // Find tasks for requests made by this requester
      const Request = require('../models/Request');
      const myRequests = await Request.find({ requester: req.user._id }).select('_id');
      const requestIds = myRequests.map(r => r._id);
      
      tasks = await DeliveryTask.find({ 
        request: { $in: requestIds }
      })
        .populate('volunteer', 'name email rating')
        .populate('request', 'resourceType quantity urgency location')
        .populate('resource', 'type quantity description location')
        .populate({
          path: 'resource',
          populate: { path: 'donor', select: 'name email location' }
        })
        .sort({ createdAt: -1 });

      console.log(`Found ${tasks.length} tasks for requester ${req.user.name}`);
    } else {
      return res.status(403).json({ message: 'Access denied. Volunteers and requesters only.' });
    }
    
    res.json(tasks);
  } catch (err) {
    console.error('Get delivery tasks error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific delivery task
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await DeliveryTask.findById(req.params.id)
      .populate('volunteer', 'name email rating')
      .populate('request', 'resourceType quantity urgency location')
      .populate('resource', 'type quantity description location')
      .populate({
        path: 'request',
        populate: { path: 'requester', select: 'name email' }
      })
      .populate({
        path: 'resource',
        populate: { path: 'donor', select: 'name email location' }
      });

    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject a delivery task
router.patch('/:id/reject', authMiddleware, roleMiddleware(['volunteer']), async (req, res) => {
  try {
    const task = await DeliveryTask.findById(req.params.id)
      .populate('request')
      .populate('resource');
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.volunteer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (task.status !== 'assigned') {
      return res.status(400).json({ message: 'Can only reject assigned tasks' });
    }

    // Delete the task
    await DeliveryTask.findByIdAndDelete(req.params.id);

    // Reset request and resource
    const request = await Request.findById(task.request._id);
    if (request) {
      request.assignedVolunteer = null;
      request.assignedResource = null;
      await request.save();
    }

    const resource = await Resource.findById(task.resource._id);
    if (resource) {
      resource.status = 'available';
      await resource.save();
    }

    // Notify requester
    const io = req.app.get('io');
    if (io && request) {
      io.to(request.requester.toString()).emit('statusUpdate', {
        taskId: task._id,
        status: 'rejected',
        message: 'Volunteer rejected the task. Finding another volunteer...'
      });
    }

    res.json({ message: 'Task rejected successfully' });
  } catch (err) {
    console.error('Reject task error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Accept a delivery task
router.patch('/:id/accept', authMiddleware, roleMiddleware(['volunteer']), async (req, res) => {
  try {
    const task = await DeliveryTask.findById(req.params.id);
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.volunteer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (task.status !== 'assigned') {
      return res.status(400).json({ message: 'Task already accepted' });
    }

    task.status = 'accepted';
    task.acceptedAt = new Date();
    
    // Initialize statusHistory if it doesn't exist
    if (!task.statusHistory) {
      task.statusHistory = [];
    }
    
    task.statusHistory.push({
      status: 'accepted',
      timestamp: new Date(),
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });
    
    await task.save();

    res.json({ message: 'Task accepted', task });
  } catch (err) {
    console.error('Accept task error:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Mark as picked up from donor
router.patch('/:id/pickup', authMiddleware, roleMiddleware(['volunteer']), async (req, res) => {
  try {
    const task = await DeliveryTask.findById(req.params.id).populate('request');
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.volunteer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    task.status = 'picked-up';
    task.pickedUpAt = new Date();
    
    // Initialize statusHistory if it doesn't exist
    if (!task.statusHistory) {
      task.statusHistory = [];
    }
    
    task.statusHistory.push({
      status: 'picked-up',
      timestamp: new Date(),
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });
    await task.save();

    // Notify requester via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(task.request.requester.toString()).emit('statusUpdate', {
        taskId: task._id,
        status: 'picked-up',
        message: 'Volunteer picked up your resource from donor'
      });
    }

    res.json({ message: 'Resource picked up', task });
  } catch (err) {
    console.error('Pickup task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark as in-transit
router.patch('/:id/transit', authMiddleware, roleMiddleware(['volunteer']), async (req, res) => {
  try {
    const task = await DeliveryTask.findById(req.params.id).populate('request');
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.volunteer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    task.status = 'in-transit';
    task.inTransitAt = new Date();
    
    // Initialize statusHistory if it doesn't exist
    if (!task.statusHistory) {
      task.statusHistory = [];
    }
    
    task.statusHistory.push({
      status: 'in-transit',
      timestamp: new Date(),
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });
    await task.save();

    // Notify requester via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(task.request.requester.toString()).emit('statusUpdate', {
        taskId: task._id,
        status: 'in-transit',
        message: 'Volunteer is on the way to you!'
      });
    }

    res.json({ message: 'Delivery in transit', task });
  } catch (err) {
    console.error('Transit task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update live location (for real-time tracking)
router.patch('/:id/location', authMiddleware, roleMiddleware(['volunteer']), async (req, res) => {
  try {
    const { location } = req.body; // { coordinates: [lng, lat] }
    const task = await DeliveryTask.findById(req.params.id).populate('request');
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.volunteer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update live location
    task.liveLocation = {
      type: 'Point',
      coordinates: location.coordinates,
      timestamp: new Date()
    };
    
    // Initialize locationHistory if it doesn't exist
    if (!task.locationHistory) {
      task.locationHistory = [];
    }
    
    // Add to location history
    task.locationHistory.push({
      coordinates: location.coordinates,
      timestamp: new Date(),
      status: task.status
    });
    
    await task.save();

    // Broadcast location to requester via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(task.request.requester.toString()).emit('volunteerLocationUpdate', {
        taskId: task._id,
        location: location.coordinates,
        status: task.status,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Location updated', task });
  } catch (err) {
    console.error('Update location error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start delivery (mark in-progress)
router.patch('/:id/start', authMiddleware, roleMiddleware(['volunteer']), async (req, res) => {
  try {
    const task = await DeliveryTask.findById(req.params.id);
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.volunteer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    task.status = 'in-progress';
    task.startedAt = new Date();
    await task.save();

    res.json({ message: 'Delivery started', task });
  } catch (err) {
    console.error('Start delivery error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete delivery
router.patch('/:id/complete', authMiddleware, roleMiddleware(['volunteer']), async (req, res) => {
  try {
    const task = await DeliveryTask.findById(req.params.id).populate('request');
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.volunteer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    task.status = 'delivered';
    task.completedAt = new Date();
    task.actualDeliveryTime = new Date();
    
    // Initialize statusHistory if it doesn't exist
    if (!task.statusHistory) {
      task.statusHistory = [];
    }
    
    task.statusHistory.push({
      status: 'delivered',
      timestamp: new Date(),
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });
    await task.save();

    // Update request status
    const request = await Request.findById(task.request);
    if (request) {
      request.status = 'fulfilled';
      await request.save();
    }

    // Update resource status ONLY if quantity is 0
    const resource = await Resource.findById(task.resource);
    if (resource) {
      // Only mark as delivered if no quantity remaining
      if (resource.quantity <= 0) {
        resource.status = 'delivered';
        await resource.save();
      }
      // If quantity > 0, keep status as 'available' for future requests
    }

    // Notify requester via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(task.request.requester.toString()).emit('statusUpdate', {
        taskId: task._id,
        status: 'delivered',
        message: 'Delivery completed successfully!'
      });
    }

    res.json({ message: 'Delivery completed', task });
  } catch (err) {
    console.error('Complete delivery error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle volunteer availability
router.patch('/availability/toggle', authMiddleware, roleMiddleware(['volunteer']), async (req, res) => {
  try {
    req.user.availability = !req.user.availability;
    await req.user.save();

    res.json({ 
      message: `Availability set to ${req.user.availability ? 'available' : 'unavailable'}`,
      availability: req.user.availability 
    });
  } catch (err) {
    console.error('Toggle availability error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate a volunteer (called by requester after delivery)
router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const task = await DeliveryTask.findById(req.params.id).populate('request');
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed deliveries' });
    }
    if (task.request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the requester can rate this delivery' });
    }

    // Update volunteer rating
    const volunteer = await User.findById(task.volunteer);
    const newRatingCount = volunteer.ratingCount + 1;
    const newRating = ((volunteer.rating * volunteer.ratingCount) + rating) / newRatingCount;
    
    volunteer.rating = newRating;
    volunteer.ratingCount = newRatingCount;
    await volunteer.save();

    res.json({ 
      message: 'Rating submitted successfully',
      volunteerRating: newRating.toFixed(2)
    });
  } catch (err) {
    console.error('Rate volunteer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = { router, findAndAssignVolunteer };
