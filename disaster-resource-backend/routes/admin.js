// routes/admin.js
const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Request = require('../models/Request');
const DeliveryTask = require('../models/DeliveryTask');
const Dispute = require('../models/Dispute');
const router = express.Router();

// All admin routes require admin role
router.use(authMiddleware, roleMiddleware(['admin']));

// ==================== USER MANAGEMENT ====================

// Get all users with filters
router.get('/users', async (req, res) => {
  try {
    const { role, verificationStatus, isActive } = req.query;
    const filter = {};
    
    if (role) filter.role = role;
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get user statistics
    let stats = {};
    if (user.role === 'donor') {
      const resources = await Resource.find({ donor: user._id });
      stats.totalResources = resources.length;
      stats.deliveredResources = resources.filter(r => r.status === 'delivered').length;
    } else if (user.role === 'requester') {
      const requests = await Request.find({ requester: user._id });
      stats.totalRequests = requests.length;
      stats.fulfilledRequests = requests.filter(r => r.status === 'fulfilled').length;
    } else if (user.role === 'volunteer') {
      const tasks = await DeliveryTask.find({ volunteer: user._id });
      stats.totalDeliveries = tasks.length;
      stats.completedDeliveries = tasks.filter(t => t.status === 'completed').length;
    }

    res.json({ user, stats });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve user
router.patch('/users/:id/approve', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isApproved = true;
    user.verificationStatus = 'verified';
    await user.save();

    res.json({ message: 'User approved successfully', user });
  } catch (err) {
    console.error('Approve user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject user
router.patch('/users/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isApproved = false;
    user.verificationStatus = 'rejected';
    await user.save();

    res.json({ message: 'User rejected', user });
  } catch (err) {
    console.error('Reject user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate/Activate user
router.patch('/users/:id/toggle-active', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, 
      user 
    });
  } catch (err) {
    console.error('Toggle user active error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (soft delete - deactivate)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== RESOURCE OVERSIGHT ====================

// Get all resources with filters
router.get('/resources', async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;

    const resources = await Resource.find(filter)
      .populate('donor', 'name email rating')
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (err) {
    console.error('Get resources error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Reject critical resource
router.patch('/resources/:id/approve', async (req, res) => {
  try {
    const { approved } = req.body;
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    if (!approved) {
      resource.status = 'rejected';
    }

    await resource.save();
    res.json({ message: `Resource ${approved ? 'approved' : 'rejected'}`, resource });
  } catch (err) {
    console.error('Approve resource error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== DELIVERY MONITORING ====================

// Get all delivery tasks
router.get('/delivery-tasks', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const tasks = await DeliveryTask.find(filter)
      .populate('volunteer', 'name email rating')
      .populate('request', 'resourceType quantity urgency')
      .populate('resource', 'type quantity')
      .populate({
        path: 'request',
        populate: { path: 'requester', select: 'name email' }
      })
      .populate({
        path: 'resource',
        populate: { path: 'donor', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error('Get delivery tasks error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== DISPUTE RESOLUTION ====================

// Get all disputes
router.get('/disputes', async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const disputes = await Dispute.find(filter)
      .populate('deliveryTask')
      .populate('reportedBy', 'name email role')
      .populate('reportedAgainst', 'name email role')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(disputes);
  } catch (err) {
    console.error('Get disputes error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create dispute (can also be done by users)
router.post('/disputes', async (req, res) => {
  try {
    const { deliveryTaskId, reportedAgainst, type, description, priority } = req.body;

    const dispute = new Dispute({
      deliveryTask: deliveryTaskId,
      reportedBy: req.user._id,
      reportedAgainst,
      type,
      description,
      priority: priority || 'medium'
    });

    await dispute.save();
    res.json({ message: 'Dispute created successfully', dispute });
  } catch (err) {
    console.error('Create dispute error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update dispute status
router.patch('/disputes/:id', async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    if (status) dispute.status = status;
    if (resolution) {
      dispute.resolution = resolution;
      dispute.resolvedBy = req.user._id;
      dispute.resolvedAt = new Date();
    }

    await dispute.save();
    res.json({ message: 'Dispute updated successfully', dispute });
  } catch (err) {
    console.error('Update dispute error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== MATCHING ANALYTICS ====================

// Get matching performance analytics
router.get('/analytics/matching', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    const now = new Date();
    const daysAgo = period === '30d' ? 30 : 7;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Get all requests in period
    const requests = await Request.find({ createdAt: { $gte: startDate } });
    const totalRequests = requests.length;
    const matchedRequests = requests.filter(r => r.assignedResource).length;
    const matchRate = totalRequests > 0 ? (matchedRequests / totalRequests * 100).toFixed(2) : 0;

    // Get delivery tasks to analyze matching quality
    const deliveryTasks = await DeliveryTask.find({ createdAt: { $gte: startDate } })
      .populate('volunteer', 'rating')
      .populate('resource')
      .populate('request', 'urgency');

    // Calculate average volunteer rating for matched tasks
    const avgVolunteerRating = deliveryTasks.length > 0
      ? (deliveryTasks.reduce((sum, task) => sum + (task.volunteer?.rating || 0), 0) / deliveryTasks.length).toFixed(2)
      : 0;

    // Analyze by urgency
    const urgencyStats = {
      high: { total: 0, matched: 0 },
      medium: { total: 0, matched: 0 },
      low: { total: 0, matched: 0 }
    };

    requests.forEach(req => {
      const urgency = req.urgency || 'medium';
      urgencyStats[urgency].total++;
      if (req.assignedResource) urgencyStats[urgency].matched++;
    });

    res.json({
      period,
      overall: {
        totalRequests,
        matchedRequests,
        unmatchedRequests: totalRequests - matchedRequests,
        matchRate: `${matchRate}%`
      },
      quality: {
        avgVolunteerRating,
        totalDeliveries: deliveryTasks.length,
        completedDeliveries: deliveryTasks.filter(t => t.status === 'completed').length
      },
      byUrgency: {
        high: {
          ...urgencyStats.high,
          matchRate: urgencyStats.high.total > 0 
            ? `${(urgencyStats.high.matched / urgencyStats.high.total * 100).toFixed(2)}%` 
            : '0%'
        },
        medium: {
          ...urgencyStats.medium,
          matchRate: urgencyStats.medium.total > 0 
            ? `${(urgencyStats.medium.matched / urgencyStats.medium.total * 100).toFixed(2)}%` 
            : '0%'
        },
        low: {
          ...urgencyStats.low,
          matchRate: urgencyStats.low.total > 0 
            ? `${(urgencyStats.low.matched / urgencyStats.low.total * 100).toFixed(2)}%` 
            : '0%'
        }
      }
    });
  } catch (err) {
    console.error('Get matching analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ANALYTICS & STATISTICS ====================

// Get dashboard statistics
router.get('/analytics/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalDonors,
      totalRequesters,
      totalVolunteers,
      pendingUsers,
      totalResources,
      availableResources,
      totalRequests,
      pendingRequests,
      fulfilledRequests,
      totalDeliveries,
      completedDeliveries,
      inProgressDeliveries,
      openDisputes
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'donor', isActive: true }),
      User.countDocuments({ role: 'requester', isActive: true }),
      User.countDocuments({ role: 'volunteer', isActive: true }),
      User.countDocuments({ verificationStatus: 'pending' }),
      Resource.countDocuments(),
      Resource.countDocuments({ status: 'available' }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
      Request.countDocuments({ status: 'fulfilled' }),
      DeliveryTask.countDocuments(),
      DeliveryTask.countDocuments({ status: 'completed' }),
      DeliveryTask.countDocuments({ status: 'in-progress' }),
      Dispute.countDocuments({ status: 'open' })
    ]);

    // Get recent activities
    const recentDeliveries = await DeliveryTask.find()
      .populate('volunteer', 'name')
      .populate('request', 'resourceType')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentRequests = await Request.find()
      .populate('requester', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Top volunteers by rating
    const topVolunteers = await User.find({ role: 'volunteer', isActive: true })
      .select('name rating ratingCount')
      .sort({ rating: -1, ratingCount: -1 })
      .limit(5);

    res.json({
      users: {
        total: totalUsers,
        donors: totalDonors,
        requesters: totalRequesters,
        volunteers: totalVolunteers,
        pending: pendingUsers
      },
      resources: {
        total: totalResources,
        available: availableResources,
        utilized: totalResources - availableResources
      },
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        fulfilled: fulfilledRequests
      },
      deliveries: {
        total: totalDeliveries,
        completed: completedDeliveries,
        inProgress: inProgressDeliveries
      },
      disputes: {
        open: openDisputes
      },
      recentActivities: {
        deliveries: recentDeliveries,
        requests: recentRequests
      },
      topVolunteers
    });
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get time-series data for charts
router.get('/analytics/trends', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const daysAgo = period === '30d' ? 30 : 7;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Aggregate data by day
    const requestsTrend = await Request.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const deliveriesTrend = await DeliveryTask.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      requests: requestsTrend,
      deliveries: deliveriesTrend
    });
  } catch (err) {
    console.error('Get trends error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
