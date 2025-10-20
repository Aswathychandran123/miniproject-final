// Fix existing resources - set status back to 'available' if quantity > 0
require('dotenv').config();
const mongoose = require('mongoose');
const Resource = require('./models/Resource');

async function fixResources() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all resources with quantity > 0 but status is 'requested'
    const resources = await Resource.find({
      quantity: { $gt: 0 },
      status: 'requested'
    });

    console.log(`Found ${resources.length} resources to fix`);

    for (const resource of resources) {
      console.log(`Fixing: ${resource.type} (qty: ${resource.quantity}) - status: ${resource.status} → available`);
      resource.status = 'available';
      await resource.save();
    }

    console.log('✅ All resources fixed!');
    
    // Show all available resources
    const available = await Resource.find({ status: 'available' });
    console.log('\n📦 Available resources:');
    available.forEach(r => {
      console.log(`  - ${r.type}: ${r.quantity} units`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixResources();
