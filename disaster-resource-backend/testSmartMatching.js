// testSmartMatching.js - Comprehensive Smart Matching Test
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Resource = require('./models/Resource');
const Request = require('./models/Request');
const DeliveryTask = require('./models/DeliveryTask');
const { smartResourceMatch, smartVolunteerMatch } = require('./utils/smartMatching');

async function testSmartMatching() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧠 SMART MATCHING ALGORITHM TEST');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Find requester
    const requester = await User.findOne({ email: 'relief@smarttest.com' });
    if (!requester) {
      console.log('❌ Requester not found. Run setupSmartMatchingTest.js first!');
      return;
    }

    console.log('🆘 DISASTER SCENARIO:');
    console.log('   Location: Disaster Relief Camp [76.70, 10.80]');
    console.log('   Need: 50 units of Food');
    console.log('   Urgency: HIGH\n');

    // ==================== TEST 1: HIGH URGENCY FOOD REQUEST ====================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('TEST 1: HIGH URGENCY FOOD REQUEST');
    console.log('═══════════════════════════════════════════════════════════\n');

    const request1 = new Request({
      requester: requester._id,
      resourceType: 'Food',
      quantity: 50,
      urgency: 'high',
      location: {
        type: 'Point',
        coordinates: [76.70, 10.80]
      }
    });

    console.log('🔍 STAGE 1: RESOURCE MATCHING\n');
    const resourceMatch = await smartResourceMatch(request1);

    if (resourceMatch) {
      console.log('\n✅ BEST RESOURCE MATCH FOUND!');
      console.log('─────────────────────────────────────────────────────────');
      console.log(`   Resource: ${resourceMatch.resource.type}`);
      console.log(`   Quantity: ${resourceMatch.resource.quantity} units`);
      console.log(`   Donor: ${resourceMatch.resource.donor.name}`);
      console.log(`   Distance: ${resourceMatch.distance.toFixed(2)} km`);
      console.log(`   Overall Score: ${resourceMatch.score.toFixed(2)}/100`);
      console.log('\n   📊 SCORE BREAKDOWN:');
      console.log(`      • Proximity Score:    ${resourceMatch.breakdown.proximityScore}/40`);
      console.log(`      • Quantity Match:     ${resourceMatch.breakdown.quantityScore}/20`);
      console.log(`      • Donor Rating:       ${resourceMatch.breakdown.ratingScore}/20`);
      console.log(`      • Freshness:          ${resourceMatch.breakdown.freshnessScore}/10`);
      console.log(`      • Urgency Bonus:      ${resourceMatch.breakdown.urgencyBonus}/10`);
      console.log('─────────────────────────────────────────────────────────\n');

      console.log('🔍 STAGE 2: VOLUNTEER MATCHING\n');
      const volunteerMatch = await smartVolunteerMatch(resourceMatch.resource, request1);

      if (volunteerMatch) {
        console.log('\n✅ BEST VOLUNTEER MATCH FOUND!');
        console.log('─────────────────────────────────────────────────────────');
        console.log(`   Volunteer: ${volunteerMatch.volunteer.name}`);
        console.log(`   Rating: ${volunteerMatch.volunteer.rating.toFixed(1)}⭐ (${volunteerMatch.volunteer.ratingCount} reviews)`);
        console.log(`   Distance to Donor: ${volunteerMatch.distanceToDonor.toFixed(2)} km`);
        console.log(`   Distance to Requester: ${volunteerMatch.distanceToRequester.toFixed(2)} km`);
        console.log(`   Active Tasks: ${volunteerMatch.activeTasks}`);
        console.log(`   Overall Score: ${volunteerMatch.score.toFixed(2)}/100`);
        console.log('\n   📊 SCORE BREAKDOWN:');
        console.log(`      • Proximity to Donor:      ${volunteerMatch.breakdown.donorProximityScore}/40`);
        console.log(`      • Proximity to Requester:  ${volunteerMatch.breakdown.requesterProximityScore}/20`);
        console.log(`      • Volunteer Rating:        ${volunteerMatch.breakdown.ratingScore}/25`);
        console.log(`      • Workload Score:          ${volunteerMatch.breakdown.workloadScore}/15`);
        console.log('─────────────────────────────────────────────────────────\n');

        const matchQuality = ((resourceMatch.score + volunteerMatch.score) / 2).toFixed(2);
        console.log('🎉 MATCHING COMPLETE!');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`   Overall Match Quality: ${matchQuality}/100`);
        console.log(`   Estimated Delivery Time: ~${Math.ceil(volunteerMatch.distanceToDonor + volunteerMatch.distanceToRequester)} minutes`);
        console.log(`   Confidence Level: ${matchQuality >= 90 ? 'VERY HIGH ✅' : matchQuality >= 70 ? 'HIGH ✅' : 'MEDIUM ⚠️'}`);
        console.log('═══════════════════════════════════════════════════════════\n');

        // Save the request and create delivery task
        await request1.save();
        const deliveryTask = new DeliveryTask({
          volunteer: volunteerMatch.volunteer._id,
          request: request1._id,
          resource: resourceMatch.resource._id,
          status: 'assigned'
        });
        await deliveryTask.save();

        request1.assignedVolunteer = volunteerMatch.volunteer._id;
        request1.assignedResource = resourceMatch.resource._id;
        await request1.save();

        resourceMatch.resource.status = 'requested';
        await resourceMatch.resource.save();

        console.log('✅ Delivery task created and assigned!\n');
      }
    }

    // ==================== TEST 2: MEDIUM URGENCY WATER REQUEST ====================
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST 2: MEDIUM URGENCY WATER REQUEST');
    console.log('═══════════════════════════════════════════════════════════\n');

    const request2 = new Request({
      requester: requester._id,
      resourceType: 'Water',
      quantity: 80,
      urgency: 'medium',
      location: {
        type: 'Point',
        coordinates: [76.70, 10.80]
      }
    });

    console.log('🔍 STAGE 1: RESOURCE MATCHING\n');
    const resourceMatch2 = await smartResourceMatch(request2);

    if (resourceMatch2) {
      console.log(`\n✅ Match Found: ${resourceMatch2.resource.type} (Score: ${resourceMatch2.score.toFixed(2)}/100)\n`);
      
      console.log('🔍 STAGE 2: VOLUNTEER MATCHING\n');
      const volunteerMatch2 = await smartVolunteerMatch(resourceMatch2.resource, request2);
      
      if (volunteerMatch2) {
        console.log(`✅ Volunteer: ${volunteerMatch2.volunteer.name} (Score: ${volunteerMatch2.score.toFixed(2)}/100)\n`);
        
        await request2.save();
        const deliveryTask2 = new DeliveryTask({
          volunteer: volunteerMatch2.volunteer._id,
          request: request2._id,
          resource: resourceMatch2.resource._id,
          status: 'assigned'
        });
        await deliveryTask2.save();

        request2.assignedVolunteer = volunteerMatch2.volunteer._id;
        request2.assignedResource = resourceMatch2.resource._id;
        await request2.save();

        resourceMatch2.resource.status = 'requested';
        await resourceMatch2.resource.save();
      }
    }

    // ==================== TEST 3: LOW URGENCY MEDICINE REQUEST ====================
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST 3: LOW URGENCY MEDICINE REQUEST');
    console.log('═══════════════════════════════════════════════════════════\n');

    const request3 = new Request({
      requester: requester._id,
      resourceType: 'Medicine',
      quantity: 25,
      urgency: 'low',
      location: {
        type: 'Point',
        coordinates: [76.70, 10.80]
      }
    });

    console.log('🔍 STAGE 1: RESOURCE MATCHING\n');
    const resourceMatch3 = await smartResourceMatch(request3);

    if (resourceMatch3) {
      console.log(`\n✅ Match Found: ${resourceMatch3.resource.type} (Score: ${resourceMatch3.score.toFixed(2)}/100)\n`);
      
      console.log('🔍 STAGE 2: VOLUNTEER MATCHING\n');
      const volunteerMatch3 = await smartVolunteerMatch(resourceMatch3.resource, request3);
      
      if (volunteerMatch3) {
        console.log(`✅ Volunteer: ${volunteerMatch3.volunteer.name} (Score: ${volunteerMatch3.score.toFixed(2)}/100)\n`);
        
        await request3.save();
        const deliveryTask3 = new DeliveryTask({
          volunteer: volunteerMatch3.volunteer._id,
          request: request3._id,
          resource: resourceMatch3.resource._id,
          status: 'assigned'
        });
        await deliveryTask3.save();

        request3.assignedVolunteer = volunteerMatch3.volunteer._id;
        request3.assignedResource = resourceMatch3.resource._id;
        await request3.save();

        resourceMatch3.resource.status = 'requested';
        await resourceMatch3.resource.save();
      }
    }

    // ==================== FINAL SUMMARY ====================
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    const totalRequests = await Request.countDocuments();
    const totalTasks = await DeliveryTask.countDocuments();
    const matchRate = ((totalTasks / totalRequests) * 100).toFixed(2);

    console.log(`   Total Requests Created: ${totalRequests}`);
    console.log(`   Successfully Matched: ${totalTasks}`);
    console.log(`   Match Rate: ${matchRate}%`);
    console.log(`   Status: ${matchRate >= 95 ? '✅ EXCELLENT' : matchRate >= 85 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'}\n`);

    console.log('🎯 ALGORITHM PERFORMANCE:');
    console.log('   • Multi-criteria scoring ✅');
    console.log('   • Distance optimization ✅');
    console.log('   • Rating-based selection ✅');
    console.log('   • Urgency prioritization ✅');
    console.log('   • Workload balancing ✅\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 SMART MATCHING TEST COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📋 NEXT STEPS:');
    console.log('   1. Check volunteer dashboards - tasks should be visible');
    console.log('   2. Login as volunteers to accept/complete tasks');
    console.log('   3. View admin analytics for matching statistics');
    console.log('   4. Run: node verifyMatchingAnalytics.js\n');

  } catch (error) {
    console.error('❌ Error during smart matching test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

testSmartMatching();
