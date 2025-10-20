// Migrate location from coordinates object to text string
require('dotenv').config();
const mongoose = require('mongoose');
const Resource = require('./models/Resource');
const Request = require('./models/Request');

async function migrateLocations() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Fix Resources
    const resources = await Resource.find();
    console.log(`\n📦 Migrating ${resources.length} resources...`);
    
    for (const resource of resources) {
      if (resource.location && typeof resource.location === 'object' && resource.location.coordinates) {
        // Old format: {type: 'Point', coordinates: [lng, lat]}
        resource.location = 'Not specified';
        await resource.save();
        console.log(`  ✓ Fixed resource: ${resource.type}`);
      } else if (!resource.location || resource.location === '') {
        resource.location = 'Not specified';
        await resource.save();
      }
    }

    // Fix Requests
    const requests = await Request.find();
    console.log(`\n📋 Migrating ${requests.length} requests...`);
    
    for (const request of requests) {
      if (request.location && typeof request.location === 'object' && request.location.coordinates) {
        // Old format: {type: 'Point', coordinates: [lng, lat]}
        request.location = 'Not specified';
        await request.save();
        console.log(`  ✓ Fixed request: ${request.resourceType}`);
      } else if (!request.location || request.location === '') {
        request.location = 'Not specified';
        await request.save();
      }
    }

    console.log('\n✅ Migration complete!');
    console.log('\n📊 Summary:');
    console.log(`  Resources: ${resources.length}`);
    console.log(`  Requests: ${requests.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

migrateLocations();
