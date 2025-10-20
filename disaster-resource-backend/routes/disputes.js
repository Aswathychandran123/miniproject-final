// routes/disputes.js
const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const Dispute = require('../models/Dispute');
const DeliveryTask = require('../models/DeliveryTask');
const router = express.Router();

// Create a dispute (any authenticated user)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { deliveryTaskId, reportedAgainst, type, description, priority } = req.body;

    // Verify delivery task exists
    const deliveryTask = await DeliveryTask.findById(deliveryTaskId);
    if (!deliveryTask) {
      return res.status(404).json({ message: 'Delivery task not found' });
    }

    const dispute = new Dispute({
      deliveryTask: deliveryTaskId,
      reportedBy: req.user._id,
      reportedAgainst,
      type,
      description,
      priority: priority || 'medium'
    });

    await dispute.save();
    
    res.json({ 
      message: 'Dispute reported successfully. Admin will review it shortly.', 
      dispute 
    });
  } catch (err) {
    console.error('Create dispute error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's disputes
router.get('/my-disputes', authMiddleware, async (req, res) => {
  try {
    const disputes = await Dispute.find({ reportedBy: req.user._id })
      .populate('deliveryTask')
      .populate('reportedAgainst', 'name email role')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(disputes);
  } catch (err) {
    console.error('Get my disputes error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific dispute
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('deliveryTask')
      .populate('reportedBy', 'name email role')
      .populate('reportedAgainst', 'name email role')
      .populate('resolvedBy', 'name email');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Check if user is involved in the dispute or is admin
    if (
      dispute.reportedBy._id.toString() !== req.user._id.toString() &&
      dispute.reportedAgainst?._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(dispute);
  } catch (err) {
    console.error('Get dispute error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
