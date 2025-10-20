const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Alert = require('../models/Alert');
const fraudDetection = require('../utils/fraudDetection');
const router = express.Router();

// Get all alerts (admin only)
router.get('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { type, severity, status } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    const alerts = await Alert.find(filter)
      .populate('relatedUser', 'name email role')
      .populate('relatedResource', 'type quantity')
      .populate('relatedRequest', 'resourceType quantity urgency')
      .populate('relatedDelivery', 'status')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get alert statistics (admin only)
router.get('/stats', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const totalAlerts = await Alert.countDocuments();
    const newAlerts = await Alert.countDocuments({ status: 'new' });
    const criticalAlerts = await Alert.countDocuments({ severity: 'critical', status: { $in: ['new', 'investigating'] } });
    
    const alertsByType = await Alert.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const alertsBySeverity = await Alert.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    const recentAlerts = await Alert.find({ status: 'new' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('relatedUser', 'name role');

    res.json({
      totalAlerts,
      newAlerts,
      criticalAlerts,
      alertsByType,
      alertsBySeverity,
      recentAlerts
    });
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single alert details (admin only)
router.get('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('relatedUser', 'name email role rating ratingCount')
      .populate('relatedResource', 'type quantity description status')
      .populate('relatedRequest', 'resourceType quantity urgency status')
      .populate('relatedDelivery', 'status acceptedAt completedAt')
      .populate('resolvedBy', 'name email');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Get alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update alert status (admin only)
router.patch('/:id/status', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { status, resolution } = req.body;
    
    if (!['new', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = status;
    
    if (status === 'resolved' || status === 'dismissed') {
      alert.resolvedBy = req.user.userId;
      alert.resolvedAt = new Date();
      if (resolution) alert.resolution = resolution;
    }

    await alert.save();

    res.json({ message: 'Alert status updated', alert });
  } catch (error) {
    console.error('Update alert status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Run fraud detection checks manually (admin only)
router.post('/run-checks', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const results = await fraudDetection.runAllChecks();
    res.json({
      message: 'Fraud detection checks completed',
      results
    });
  } catch (error) {
    console.error('Run fraud checks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check suspicious activity for a specific user (admin only)
router.post('/check-user/:userId', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const alerts = await fraudDetection.checkSuspiciousActivity(req.params.userId);
    res.json({
      message: 'User activity check completed',
      alerts: alerts || []
    });
  } catch (error) {
    console.error('Check user activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete alert (admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
