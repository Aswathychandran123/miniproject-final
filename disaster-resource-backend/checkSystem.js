// checkSystem.js - Diagnostic script to check why delivery tasks aren't being assigned
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Resource = require('./models/Resource');
const Request = require('./models/Request');
const DeliveryTask = require('./models/DeliveryTask');

async function checkSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/disaster-resource-db');
    console.log('✅ Connected to MongoDB\n');

    // Check Volunteers
    console.log('=== VOLUNTEERS CHECK ===');
    const allVolunteers = await User.find({ role: 'volunteer' });
    console.log(`Total volunteers: ${allVolunteers.length}`);
    
    if (allVolunteers.length === 0) {
      console.log('❌ NO VOLUNTEERS FOUND - This is why tasks are not assigned!');
      console.log('   Solution: Register at least one user with role="volunteer"\n');
    } else {
      allVolunteers.forEach(v => {
        const status = v.availability && v.isApproved && v.isActive ? '✅' : '❌';
        console.log(`${status} ${v.name} (${v.email})`);
        console.log(`   - availability: ${v.availability}`);
        console.log(`   - isApproved: ${v.isApproved}`);
        console.log(`   - isActive: ${v.isActive}`);
        console.log(`   - rating: ${v.rating}⭐ (${v.ratingCount} ratings)`);
      });

      const availableVolunteers = await User.find({
        role: 'volunteer',
        availability: true,
        isApproved: true,
        isActive: true
      });
      console.log(`\n✅ Available volunteers: ${availableVolunteers.length}`);
      if (availableVolunteers.length === 0) {
        console.log('❌ No volunteers are AVAILABLE for tasks!');
        console.log('   Check: availability=true, isApproved=true, isActive=true\n');
      }
    }

    // Check Resources
    console.log('\n=== RESOURCES CHECK ===');
    const allResources = await Resource.find().populate('donor', 'name');
    console.log(`Total resources: ${allResources.length}`);
    
    const availableResources = await Resource.find({ status: 'available' }).populate('donor', 'name');
    console.log(`Available resources: ${availableResources.length}`);
    
    if (availableResources.length === 0) {
      console.log('❌ NO AVAILABLE RESOURCES - Add resources as donor first!\n');
    } else {
      availableResources.forEach(r => {
        console.log(`✅ ${r.type} - Qty: ${r.quantity} (from ${r.donor?.name || 'Unknown'})`);
      });
    }

    // Check Requests
    console.log('\n=== REQUESTS CHECK ===');
    const allRequests = await Request.find().populate('requester', 'name').sort({ createdAt: -1 }).limit(5);
    console.log(`Total requests: ${allRequests.length}`);
    
    if (allRequests.length > 0) {
      console.log('Recent requests:');
      allRequests.forEach(r => {
        const status = r.assignedVolunteer ? '✅ Assigned' : '❌ Not Assigned';
        console.log(`${status} - ${r.resourceType} x${r.quantity} (${r.urgency}) by ${r.requester?.name || 'Unknown'}`);
      });
    }

    // Check Delivery Tasks
    console.log('\n=== DELIVERY TASKS CHECK ===');
    const allTasks = await DeliveryTask.find()
      .populate('volunteer', 'name')
      .populate('request', 'resourceType quantity')
      .sort({ createdAt: -1 })
      .limit(5);
    console.log(`Total delivery tasks: ${allTasks.length}`);
    
    if (allTasks.length === 0) {
      console.log('❌ NO DELIVERY TASKS CREATED\n');
    } else {
      allTasks.forEach(t => {
        console.log(`✅ ${t.status} - ${t.request?.resourceType} assigned to ${t.volunteer?.name}`);
      });
    }

    // Summary
    console.log('\n=== DIAGNOSIS SUMMARY ===');
    const hasVolunteers = allVolunteers.length > 0;
    const hasAvailableVolunteers = await User.countDocuments({
      role: 'volunteer',
      availability: true,
      isApproved: true,
      isActive: true
    }) > 0;
    const hasResources = availableResources.length > 0;
    
    if (!hasVolunteers) {
      console.log('❌ PROBLEM: No volunteers registered');
      console.log('   FIX: Register a user with role="volunteer"');
    } else if (!hasAvailableVolunteers) {
      console.log('❌ PROBLEM: Volunteers exist but none are available');
      console.log('   FIX: Ensure volunteer has:');
      console.log('        - availability: true (toggle in dashboard)');
      console.log('        - isApproved: true (admin approval)');
      console.log('        - isActive: true');
    } else if (!hasResources) {
      console.log('❌ PROBLEM: No available resources');
      console.log('   FIX: Login as donor and add resources');
    } else {
      console.log('✅ System is ready! Volunteers and resources exist.');
      console.log('   Try submitting a request as requester.');
    }

    await mongoose.connection.close();
    console.log('\n✅ Diagnostic complete');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSystem();
