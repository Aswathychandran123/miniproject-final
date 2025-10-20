// setupSmartMatchingTest.js - Complete test data setup for Smart Matching demonstration
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Resource = require('./models/Resource');
const Request = require('./models/Request');
const DeliveryTask = require('./models/DeliveryTask');

async function setupTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing test data
    console.log('🧹 Cleaning up old test data...');
    await User.deleteMany({ email: { $regex: /@smarttest\.com$/ } });
    await Resource.deleteMany({});
    await Request.deleteMany({});
    await DeliveryTask.deleteMany({});
    console.log('✅ Cleanup complete\n');

    // ==================== CREATE ADMIN ====================
    console.log('👤 Creating Admin...');
    const hashedAdminPass = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin Master',
      email: 'admin@smarttest.com',
      password: hashedAdminPass,
      role: 'admin',
      isApproved: true,
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [76.70, 10.80]
      }
    });
    console.log(`✅ Admin created: ${admin.name}\n`);

    // ==================== CREATE DONORS ====================
    console.log('👥 Creating Donors with different ratings...\n');
    
    const hashedPass = await bcrypt.hash('test123', 10);
    
    // High-rated donor - Close to disaster zone
    const donor1 = await User.create({
      name: 'Sarah Johnson',
      email: 'sarah@smarttest.com',
      password: hashedPass,
      role: 'donor',
      rating: 4.8,
      ratingCount: 15,
      isApproved: true,
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [76.65, 10.78] // ~6 km from disaster zone
      }
    });
    console.log(`✅ Donor 1: ${donor1.name} - Rating: ${donor1.rating}⭐ (${donor1.ratingCount} reviews) - Location: [76.65, 10.78]`);

    // Medium-rated donor - Medium distance
    const donor2 = await User.create({
      name: 'Michael Chen',
      email: 'michael@smarttest.com',
      password: hashedPass,
      role: 'donor',
      rating: 3.5,
      ratingCount: 8,
      isApproved: true,
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [76.75, 10.85] // ~12 km from disaster zone
      }
    });
    console.log(`✅ Donor 2: ${donor2.name} - Rating: ${donor2.rating}⭐ (${donor2.ratingCount} reviews) - Location: [76.75, 10.85]`);

    // New donor - Far location
    const donor3 = await User.create({
      name: 'Emily Rodriguez',
      email: 'emily@smarttest.com',
      password: hashedPass,
      role: 'donor',
      rating: 0,
      ratingCount: 0,
      isApproved: true,
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [77.00, 11.00] // ~35 km from disaster zone
      }
    });
    console.log(`✅ Donor 3: ${donor3.name} - Rating: ${donor3.rating}⭐ (${donor3.ratingCount} reviews) - Location: [77.00, 11.00]\n`);

    // ==================== CREATE RESOURCES ====================
    console.log('📦 Creating Resources with different characteristics...\n');

    // Resource 1: Perfect match - close, good quantity, high rating, fresh
    const resource1 = await Resource.create({
      donor: donor1._id,
      type: 'Food',
      quantity: 55,
      status: 'available',
      location: {
        type: 'Point',
        coordinates: [76.65, 10.78]
      },
      createdAt: new Date() // Fresh (today)
    });
    console.log(`✅ Resource 1: ${resource1.type} x${resource1.quantity} from ${donor1.name} - Fresh (today)`);

    // Resource 2: Medium match - medium distance, exact quantity, good rating, 2 days old
    const resource2 = await Resource.create({
      donor: donor2._id,
      type: 'Food',
      quantity: 50,
      status: 'available',
      location: {
        type: 'Point',
        coordinates: [76.75, 10.85]
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days old
    });
    console.log(`✅ Resource 2: ${resource2.type} x${resource2.quantity} from ${donor2.name} - 2 days old`);

    // Resource 3: Poor match - far, excess quantity, no rating, old
    const resource3 = await Resource.create({
      donor: donor3._id,
      type: 'Food',
      quantity: 200,
      status: 'available',
      location: {
        type: 'Point',
        coordinates: [77.00, 11.00]
      },
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days old
    });
    console.log(`✅ Resource 3: ${resource3.type} x${resource3.quantity} from ${donor3.name} - 10 days old\n`);

    // Additional resources for variety
    const resource4 = await Resource.create({
      donor: donor1._id,
      type: 'Water',
      quantity: 100,
      status: 'available',
      location: {
        type: 'Point',
        coordinates: [76.65, 10.78]
      },
      createdAt: new Date()
    });
    console.log(`✅ Resource 4: ${resource4.type} x${resource4.quantity} from ${donor1.name}`);

    const resource5 = await Resource.create({
      donor: donor2._id,
      type: 'Medicine',
      quantity: 30,
      status: 'available',
      location: {
        type: 'Point',
        coordinates: [76.75, 10.85]
      },
      createdAt: new Date()
    });
    console.log(`✅ Resource 5: ${resource5.type} x${resource5.quantity} from ${donor2.name}\n`);

    // ==================== CREATE VOLUNTEERS ====================
    console.log('🚗 Creating Volunteers with different profiles...\n');

    // Top volunteer - close to donor, high rating, no workload
    const volunteer1 = await User.create({
      name: 'Alex Martinez',
      email: 'alex@smarttest.com',
      password: hashedPass,
      role: 'volunteer',
      rating: 4.9,
      ratingCount: 25,
      availability: true,
      isApproved: true,
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [76.66, 10.79] // ~2 km from donor1, ~4 km from disaster zone
      }
    });
    console.log(`✅ Volunteer 1: ${volunteer1.name} - Rating: ${volunteer1.rating}⭐ (${volunteer1.ratingCount} reviews) - Available - Location: [76.66, 10.79]`);

    // Good volunteer - medium distance, good rating, some workload
    const volunteer2 = await User.create({
      name: 'Chris Taylor',
      email: 'chris@smarttest.com',
      password: hashedPass,
      role: 'volunteer',
      rating: 4.3,
      ratingCount: 12,
      availability: true,
      isApproved: true,
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [76.72, 10.82] // ~8 km from donor1
      }
    });
    console.log(`✅ Volunteer 2: ${volunteer2.name} - Rating: ${volunteer2.rating}⭐ (${volunteer2.ratingCount} reviews) - Available - Location: [76.72, 10.82]`);

    // New volunteer - far, no rating, available
    const volunteer3 = await User.create({
      name: 'Jordan Lee',
      email: 'jordan@smarttest.com',
      password: hashedPass,
      role: 'volunteer',
      rating: 0,
      ratingCount: 0,
      availability: true,
      isApproved: true,
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [76.80, 10.90] // ~18 km from donor1
      }
    });
    console.log(`✅ Volunteer 3: ${volunteer3.name} - Rating: ${volunteer3.rating}⭐ (${volunteer3.ratingCount} reviews) - Available - Location: [76.80, 10.90]`);

    // Busy volunteer - close but has workload
    const volunteer4 = await User.create({
      name: 'Sam Wilson',
      email: 'sam@smarttest.com',
      password: hashedPass,
      role: 'volunteer',
      rating: 4.7,
      ratingCount: 18,
      availability: true,
      isApproved: true,
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [76.67, 10.79] // ~3 km from donor1
      }
    });
    console.log(`✅ Volunteer 4: ${volunteer4.name} - Rating: ${volunteer4.rating}⭐ (${volunteer4.ratingCount} reviews) - Available - Location: [76.67, 10.79]\n`);

    // ==================== CREATE REQUESTER ====================
    console.log('🆘 Creating Requester...\n');
    
    const requester = await User.create({
      name: 'Disaster Relief Camp',
      email: 'relief@smarttest.com',
      password: hashedPass,
      role: 'requester',
      isApproved: true,
      isActive: true,
      location: {
        type: 'Point',
        coordinates: [76.70, 10.80] // Disaster zone location
      }
    });
    console.log(`✅ Requester: ${requester.name} - Location: [76.70, 10.80] (Disaster Zone)\n`);

    // ==================== SUMMARY ====================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 TEST DATA SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📊 SUMMARY:');
    console.log(`   • 1 Admin`);
    console.log(`   • 3 Donors (ratings: 4.8⭐, 3.5⭐, 0⭐)`);
    console.log(`   • 5 Resources (Food x3, Water x1, Medicine x1)`);
    console.log(`   • 4 Volunteers (ratings: 4.9⭐, 4.3⭐, 4.7⭐, 0⭐)`);
    console.log(`   • 1 Requester (at disaster zone)\n`);

    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('   Admin:      admin@smarttest.com / admin123');
    console.log('   Donor 1:    sarah@smarttest.com / test123');
    console.log('   Donor 2:    michael@smarttest.com / test123');
    console.log('   Donor 3:    emily@smarttest.com / test123');
    console.log('   Volunteer 1: alex@smarttest.com / test123');
    console.log('   Volunteer 2: chris@smarttest.com / test123');
    console.log('   Volunteer 3: jordan@smarttest.com / test123');
    console.log('   Volunteer 4: sam@smarttest.com / test123');
    console.log('   Requester:  relief@smarttest.com / test123\n');

    console.log('📍 DISASTER ZONE: [76.70, 10.80]\n');

    console.log('🧪 NEXT STEPS:');
    console.log('   1. Run: node testSmartMatching.js');
    console.log('   2. Or login as requester and submit a request via UI');
    console.log('   3. Watch the smart matching algorithm in action!\n');

    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

setupTestData();
