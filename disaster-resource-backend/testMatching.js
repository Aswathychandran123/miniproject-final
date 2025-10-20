// testMatching.js - Test the matching algorithm
require('dotenv').config();
const mongoose = require('mongoose');
const { smartResourceMatch, smartVolunteerMatch } = require('./utils/smartMatching');
const Request = require('./models/Request');

async function testMatching() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/disaster-resource-db');
    console.log('✅ Connected to MongoDB\n');

    // Get the most recent request
    const request = await Request.findOne().sort({ createdAt: -1 });
    
    if (!request) {
      console.log('❌ No requests found. Create a request first.');
      process.exit(0);
    }

    console.log('=== TESTING MATCHING FOR REQUEST ===');
    console.log(`Request ID: ${request._id}`);
    console.log(`Resource Type: "${request.resourceType}"`);
    console.log(`Quantity: ${request.quantity}`);
    console.log(`Urgency: ${request.urgency}`);
    console.log(`Status: ${request.status}\n`);

    // Test resource matching
    console.log('=== STEP 1: RESOURCE MATCHING ===');
    const resourceMatch = await smartResourceMatch(request);
    
    if (!resourceMatch) {
      console.log('❌ NO RESOURCE MATCH FOUND');
      console.log('\nPossible reasons:');
      console.log('1. Resource type mismatch (check spelling/case)');
      console.log('2. Insufficient quantity');
      console.log('3. No available resources');
      process.exit(0);
    }

    console.log(`✅ Resource matched!`);
    console.log(`   Score: ${resourceMatch.score.toFixed(2)}/100`);
    console.log(`   Resource: ${resourceMatch.resource.type}`);
    console.log(`   Quantity: ${resourceMatch.resource.quantity}`);
    console.log(`   Donor: ${resourceMatch.resource.donor.name}\n`);

    // Test volunteer matching
    console.log('=== STEP 2: VOLUNTEER MATCHING ===');
    const volunteerMatch = await smartVolunteerMatch(resourceMatch.resource, request);
    
    if (!volunteerMatch) {
      console.log('❌ NO VOLUNTEER MATCH FOUND');
      console.log('\nPossible reasons:');
      console.log('1. No volunteers with availability=true');
      console.log('2. No volunteers with isApproved=true');
      console.log('3. No volunteers with isActive=true');
      process.exit(0);
    }

    console.log(`✅ Volunteer matched!`);
    console.log(`   Score: ${volunteerMatch.score.toFixed(2)}/100`);
    console.log(`   Volunteer: ${volunteerMatch.volunteer.name}`);
    console.log(`   Rating: ${volunteerMatch.volunteer.rating}⭐`);
    console.log(`   Active tasks: ${volunteerMatch.activeTasks}\n`);

    console.log('=== RESULT ===');
    console.log('✅ Matching should work! Both resource and volunteer found.');
    console.log('\nIf tasks are still not being created, check:');
    console.log('1. Backend server is running (npm run dev)');
    console.log('2. Check backend console for errors when submitting request');
    console.log('3. Try submitting a NEW request (not the old ones)');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testMatching();
