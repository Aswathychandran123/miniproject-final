// routes/resources.js
const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Resource = require('../models/Resource');
const router = express.Router();

// Add resource (donor only)
router.post('/', authMiddleware, roleMiddleware(['donor']), async (req, res) => {
  const { type, quantity, description, location } = req.body;
  try {
    const resource = new Resource({
      donor: req.user._id,
      type,
      quantity,
      description,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
      },
    });
    await resource.save();
    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all available resources (public)
router.get('/', async (req, res) => {
  try {
    const resources = await Resource.find({ status: 'available' }).populate('donor', 'name location');
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;