// createTestRequest.js - Create a test request to trigger matching
require('dotenv').config();
const mongoose = require('mongoose');
const Request = require('./models/Request');
const User = require('./models/User');
const { smartResourceMatch, smartVolunteerMatch } = require('./utils/smartMatching');
const DeliveryTask = require('./models/DeliveryTask');

async function createTestRequest() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/disaster-resource-db');
    console.log('✅ Connected to MongoDB\n');

    // Find requester
    const requester = await User.findOne({ role: 'requester' });
    if (!requester) {
      console.log('❌ No requester found. Register a requester first.');
      process.exit(0);
    }

    console.log(`Using requester: ${requester.name} (${requester.email})\n`);

    // Create test request
    const request = new Request({
      requester: requester._id,
      resourceType: 'Food',
      quantity: 50,
      urgency: 'high',
      location: 'Test Location'
    });
    await request.save();
    console.log('✅ Test request created\n');

    // Trigger smart matching
    console.log('🔍 SMART MATCHING INITIATED');
    const resourceMatch = await smartResourceMatch(request);

    if (resourceMatch) {
      console.log(`\n✅ Resource matched with score: ${resourceMatch.score.toFixed(2)}/100`);
      
      const matchedResource = resourceMatch.resource;
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

        // Update request
        request.assignedVolunteer = volunteer._id;
        request.assignedResource = matchedResource._id;
        await request.save();

        // Update resource quantity
        const originalQuantity = matchedResource.quantity;
        matchedResource.quantity -= request.quantity;
        if (matchedResource.quantity <= 0) {
          matchedResource.status = 'delivered';
          matchedResource.quantity = 0;
        }
        await matchedResource.save();

        console.log(`\n🎉 DELIVERY TASK CREATED SUCCESSFULLY!`);
        console.log(`   Task ID: ${deliveryTask._id}`);
        console.log(`   Volunteer: ${volunteer.name}`);
        console.log(`   Resource: ${matchedResource.type} (${originalQuantity} → ${matchedResource.quantity})`);
        console.log(`   Status: ${deliveryTask.status}`);
        console.log(`\n✅ Now check volunteer dashboard to see the task!`);
      } else {
        console.log('\n⚠️ No available volunteers found');
      }
    } else {
      console.log('\n⚠️ No matching resources found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestRequest();
