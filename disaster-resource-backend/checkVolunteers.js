require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Resource = require('./models/Resource'); // assuming you have a Resource model

async function matchResourcesAndVolunteers(requestType, quantityNeeded) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // --- 1️⃣ Find matching resources ---
    const resources = await Resource.find({
      type: requestType,
      status: 'available'
    });

    if (!resources.length) {
      console.log(`❌ No ${requestType} resources available!`);
    } else {
      // For simplicity, pick the first one (you can implement scoring later)
      const resource = resources[0];

      // Example scoring logic
      const proximityScore = 20; // dummy example
      const quantityScore = Math.min(quantityNeeded, resource.quantity);
      const freshnessScore = 10; // dummy example
      const ratingScore = resource.rating || 0;
      const urgencyBonus = 5;
      const totalScore = proximityScore + quantityScore + freshnessScore + ratingScore + urgencyBonus;

      console.log(`🔍 Looking for resources:`);
      console.log(`   Type: "${requestType}"`);
      console.log(`   Quantity needed: ${quantityNeeded}`);
      console.log(`   Status: available`);
      console.log(`   Found ${resources.length} matching resources`);
      console.log('Smart Matching Results:');
      console.log(`Best match: ${resource.name}`);
      console.log(`Score: ${totalScore}/100`);
      console.log('Score breakdown:', {
        proximityScore,
        quantityScore,
        ratingScore,
        freshnessScore,
        urgencyBonus,
        totalScore
      });
      console.log(`\n✅ Resource matched with score: ${totalScore}/100\n`);
    }

    // --- 2️⃣ Find available volunteers (ignore location) ---
    const volunteers = await User.find({
      role: 'volunteer',
      availability: true,
      isActive: true,
      isApproved: true
    });

    if (!volunteers.length) {
      console.error('⚠️ No available volunteers found!');
    } else {
      console.log(`🔍 Looking for volunteers:`);
      console.log(`   Role: volunteer`);
      console.log(`   Availability: true`);
      console.log(`   Active: true`);
      console.log(`   Approved: true`);
      console.log(`   Found ${volunteers.length} available volunteers`);

      volunteers.forEach(v => {
        console.log(`   - ${v.name} | Email: ${v.email}`);
      });

      // Assign task to first volunteer
      const assignedVolunteer = volunteers[0];
      console.log(`\n✅ Task can be assigned to volunteer: ${assignedVolunteer.name} | Email: ${assignedVolunteer.email}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Example usage
matchResourcesAndVolunteers('Food', 11);
