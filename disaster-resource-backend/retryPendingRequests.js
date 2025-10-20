// retryPendingRequests.js
// Script to retry matching for pending requests

const mongoose = require('mongoose');
require('dotenv').config();

const Request = require('./models/Request');
const Resource = require('./models/Resource');
const User = require('./models/User');
const DeliveryTask = require('./models/DeliveryTask');
const { smartResourceMatch, smartVolunteerMatch } = require('./utils/smartMatching');

async function retryPendingRequests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all pending requests
    const pendingRequests = await Request.find({ status: 'pending' });
    console.log(`Found ${pendingRequests.length} pending requests\n`);

    if (pendingRequests.length === 0) {
      console.log('No pending requests to process!');
      process.exit(0);
      return;
    }

    // Check volunteers
    const volunteers = await User.find({ 
      role: 'volunteer',
      availability: true,
      isApproved: true,
      isActive: true
    });
    
    console.log(`Available volunteers: ${volunteers.length}`);
    volunteers.forEach(v => {
      const hasLocation = v.location && v.location.coordinates && v.location.coordinates.length === 2;
      console.log(`- ${v.name}: ${hasLocation ? `Location [${v.location.coordinates}]` : '❌ NO LOCATION'}`);
    });
    console.log('');

    // Process each request
    for (const request of pendingRequests) {
      console.log(`\n🔍 Processing request: ${request.resourceType} x${request.quantity}`);
      console.log(`   Urgency: ${request.urgency}`);
      console.log(`   Location: [${request.location.coordinates}]`);

      // Try smart resource matching
      const resourceMatch = await smartResourceMatch(request);

      if (!resourceMatch) {
        console.log('   ❌ No matching resource found');
        continue;
      }

      console.log(`   ✅ Resource matched: ${resourceMatch.resource.type} (Score: ${resourceMatch.score.toFixed(2)})`);

      // Try smart volunteer matching
      const volunteerMatch = await smartVolunteerMatch(resourceMatch.resource, request);

      if (!volunteerMatch) {
        console.log('   ❌ No available volunteer found');
        continue;
      }

      console.log(`   ✅ Volunteer matched: ${volunteerMatch.volunteer.name} (Score: ${volunteerMatch.score.toFixed(2)})`);

      // Create delivery task
      const deliveryTask = new DeliveryTask({
        volunteer: volunteerMatch.volunteer._id,
        request: request._id,
        resource: resourceMatch.resource._id,
        status: 'assigned'
      });
      await deliveryTask.save();

      // Update request
      request.assignedVolunteer = volunteerMatch.volunteer._id;
      request.assignedResource = resourceMatch.resource._id;
      await request.save();

      // Update resource
      resourceMatch.resource.status = 'requested';
      await resourceMatch.resource.save();

      console.log(`   🎉 Delivery task created successfully!`);
    }

    console.log('\n✅ Finished processing all pending requests');
    console.log('\nRefresh the volunteer dashboard to see the tasks!');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

retryPendingRequests();
