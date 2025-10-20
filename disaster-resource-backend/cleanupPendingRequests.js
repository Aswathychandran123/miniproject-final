// Clean up old pending requests
require('dotenv').config();
const mongoose = require('mongoose');
const Request = require('./models/Request');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Delete all pending requests
    const result = await Request.deleteMany({ status: 'pending' });
    console.log(`✓ Deleted ${result.deletedCount} pending requests`);

    // Show remaining requests
    const remaining = await Request.find();
    console.log(`\n📋 Remaining requests: ${remaining.length}`);
    remaining.forEach(r => {
      console.log(`  - ${r.resourceType} x${r.quantity} (${r.status})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanup();
