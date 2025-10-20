// verifyMatchingAnalytics.js - Verify Smart Matching Analytics
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Resource = require('./models/Resource');
const Request = require('./models/Request');
const DeliveryTask = require('./models/DeliveryTask');

async function verifyAnalytics() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SMART MATCHING ANALYTICS VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════\n');

    // ==================== OVERALL STATISTICS ====================
    console.log('📈 OVERALL STATISTICS\n');

    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalRequesters = await User.countDocuments({ role: 'requester' });
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    console.log('👥 USER STATISTICS:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   • Donors: ${totalDonors}`);
    console.log(`   • Requesters: ${totalRequesters}`);
    console.log(`   • Volunteers: ${totalVolunteers}`);
    console.log(`   • Admins: ${totalAdmins}\n`);

    const totalResources = await Resource.countDocuments();
    const availableResources = await Resource.countDocuments({ status: 'available' });
    const requestedResources = await Resource.countDocuments({ status: 'requested' });
    const deliveredResources = await Resource.countDocuments({ status: 'delivered' });

    console.log('📦 RESOURCE STATISTICS:');
    console.log(`   Total Resources: ${totalResources}`);
    console.log(`   • Available: ${availableResources}`);
    console.log(`   • Requested: ${requestedResources}`);
    console.log(`   • Delivered: ${deliveredResources}\n`);

    const totalRequests = await Request.countDocuments();
    const pendingRequests = await Request.countDocuments({ status: 'pending' });
    const fulfilledRequests = await Request.countDocuments({ status: 'fulfilled' });

    console.log('🆘 REQUEST STATISTICS:');
    console.log(`   Total Requests: ${totalRequests}`);
    console.log(`   • Pending: ${pendingRequests}`);
    console.log(`   • Fulfilled: ${fulfilledRequests}\n`);

    // ==================== MATCHING PERFORMANCE ====================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 MATCHING PERFORMANCE\n');

    const matchedRequests = await Request.countDocuments({ 
      assignedVolunteer: { $exists: true, $ne: null },
      assignedResource: { $exists: true, $ne: null }
    });
    const unmatchedRequests = totalRequests - matchedRequests;
    const matchRate = totalRequests > 0 ? ((matchedRequests / totalRequests) * 100).toFixed(2) : 0;

    console.log('📊 MATCH RATE ANALYSIS:');
    console.log(`   Total Requests: ${totalRequests}`);
    console.log(`   Matched: ${matchedRequests}`);
    console.log(`   Unmatched: ${unmatchedRequests}`);
    console.log(`   Match Rate: ${matchRate}%`);
    console.log(`   Performance: ${matchRate >= 95 ? '🌟 EXCELLENT' : matchRate >= 85 ? '✅ GOOD' : matchRate >= 70 ? '⚠️ FAIR' : '❌ NEEDS IMPROVEMENT'}\n`);

    // ==================== URGENCY BREAKDOWN ====================
    console.log('🚨 MATCHING BY URGENCY LEVEL:\n');

    const urgencyLevels = ['high', 'medium', 'low'];
    for (const urgency of urgencyLevels) {
      const total = await Request.countDocuments({ urgency });
      const matched = await Request.countDocuments({ 
        urgency,
        assignedVolunteer: { $exists: true, $ne: null }
      });
      const rate = total > 0 ? ((matched / total) * 100).toFixed(2) : 0;
      
      console.log(`   ${urgency.toUpperCase()} Priority:`);
      console.log(`      Total: ${total} | Matched: ${matched} | Rate: ${rate}%`);
    }
    console.log('');

    // ==================== DELIVERY TASK STATISTICS ====================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚚 DELIVERY TASK STATISTICS\n');

    const totalTasks = await DeliveryTask.countDocuments();
    const assignedTasks = await DeliveryTask.countDocuments({ status: 'assigned' });
    const acceptedTasks = await DeliveryTask.countDocuments({ status: 'accepted' });
    const inProgressTasks = await DeliveryTask.countDocuments({ status: 'in-progress' });
    const completedTasks = await DeliveryTask.countDocuments({ status: 'completed' });
    const cancelledTasks = await DeliveryTask.countDocuments({ status: 'cancelled' });

    console.log('📋 TASK STATUS BREAKDOWN:');
    console.log(`   Total Tasks: ${totalTasks}`);
    console.log(`   • Assigned: ${assignedTasks}`);
    console.log(`   • Accepted: ${acceptedTasks}`);
    console.log(`   • In Progress: ${inProgressTasks}`);
    console.log(`   • Completed: ${completedTasks}`);
    console.log(`   • Cancelled: ${cancelledTasks}`);
    
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;
    console.log(`   Completion Rate: ${completionRate}%\n`);

    // ==================== VOLUNTEER PERFORMANCE ====================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⭐ VOLUNTEER PERFORMANCE\n');

    const volunteers = await User.find({ role: 'volunteer' }).sort({ rating: -1 });
    
    console.log('🏆 TOP VOLUNTEERS:\n');
    for (let i = 0; i < Math.min(5, volunteers.length); i++) {
      const vol = volunteers[i];
      const taskCount = await DeliveryTask.countDocuments({ volunteer: vol._id });
      const completedCount = await DeliveryTask.countDocuments({ 
        volunteer: vol._id, 
        status: 'completed' 
      });
      
      console.log(`   ${i + 1}. ${vol.name}`);
      console.log(`      Rating: ${vol.rating.toFixed(1)}⭐ (${vol.ratingCount} reviews)`);
      console.log(`      Tasks: ${taskCount} | Completed: ${completedCount}`);
      console.log(`      Available: ${vol.availability ? '✅ Yes' : '❌ No'}`);
      console.log('');
    }

    // ==================== RESOURCE TYPE ANALYSIS ====================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 RESOURCE TYPE ANALYSIS\n');

    const resourceTypes = await Resource.distinct('type');
    
    console.log('📊 RESOURCES BY TYPE:\n');
    for (const type of resourceTypes) {
      const total = await Resource.countDocuments({ type });
      const available = await Resource.countDocuments({ type, status: 'available' });
      const requested = await Resource.countDocuments({ type, status: 'requested' });
      const delivered = await Resource.countDocuments({ type, status: 'delivered' });
      
      console.log(`   ${type}:`);
      console.log(`      Total: ${total} | Available: ${available} | Requested: ${requested} | Delivered: ${delivered}`);
    }
    console.log('');

    // ==================== DONOR PERFORMANCE ====================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎁 DONOR PERFORMANCE\n');

    const donors = await User.find({ role: 'donor' }).sort({ rating: -1 });
    
    console.log('🏆 TOP DONORS:\n');
    for (let i = 0; i < Math.min(5, donors.length); i++) {
      const donor = donors[i];
      const resourceCount = await Resource.countDocuments({ donor: donor._id });
      const deliveredCount = await Resource.countDocuments({ 
        donor: donor._id, 
        status: 'delivered' 
      });
      
      console.log(`   ${i + 1}. ${donor.name}`);
      console.log(`      Rating: ${donor.rating.toFixed(1)}⭐ (${donor.ratingCount} reviews)`);
      console.log(`      Resources Added: ${resourceCount}`);
      console.log(`      Successfully Delivered: ${deliveredCount}`);
      console.log('');
    }

    // ==================== GEOGRAPHIC ANALYSIS ====================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📍 GEOGRAPHIC DISTRIBUTION\n');

    const usersWithLocation = await User.countDocuments({
      'location.coordinates': { $exists: true, $ne: [] }
    });
    const volunteersWithLocation = await User.countDocuments({
      role: 'volunteer',
      'location.coordinates': { $exists: true, $ne: [] }
    });
    const donorsWithLocation = await User.countDocuments({
      role: 'donor',
      'location.coordinates': { $exists: true, $ne: [] }
    });

    console.log('📊 LOCATION DATA COVERAGE:');
    console.log(`   Users with Location: ${usersWithLocation}/${totalUsers} (${((usersWithLocation/totalUsers)*100).toFixed(1)}%)`);
    console.log(`   Volunteers with Location: ${volunteersWithLocation}/${totalVolunteers} (${((volunteersWithLocation/totalVolunteers)*100).toFixed(1)}%)`);
    console.log(`   Donors with Location: ${donorsWithLocation}/${totalDonors} (${((donorsWithLocation/totalDonors)*100).toFixed(1)}%)\n`);

    // ==================== SYSTEM HEALTH ====================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💚 SYSTEM HEALTH CHECK\n');

    const activeVolunteers = await User.countDocuments({ 
      role: 'volunteer', 
      availability: true,
      isActive: true,
      isApproved: true
    });
    const approvedUsers = await User.countDocuments({ isApproved: true });
    const activeUsers = await User.countDocuments({ isActive: true });

    console.log('✅ SYSTEM STATUS:');
    console.log(`   Active Volunteers: ${activeVolunteers}/${totalVolunteers}`);
    console.log(`   Approved Users: ${approvedUsers}/${totalUsers}`);
    console.log(`   Active Users: ${activeUsers}/${totalUsers}`);
    console.log(`   Available Resources: ${availableResources}`);
    console.log(`   Pending Requests: ${pendingRequests}\n`);

    const healthScore = (
      (matchRate / 100) * 40 +
      (completionRate / 100) * 30 +
      ((activeVolunteers / Math.max(totalVolunteers, 1)) * 100 / 100) * 20 +
      ((availableResources / Math.max(totalResources, 1)) * 100 / 100) * 10
    ).toFixed(2);

    console.log(`🎯 OVERALL HEALTH SCORE: ${healthScore}/100`);
    console.log(`   Status: ${healthScore >= 90 ? '🌟 EXCELLENT' : healthScore >= 75 ? '✅ GOOD' : healthScore >= 60 ? '⚠️ FAIR' : '❌ NEEDS ATTENTION'}\n`);

    // ==================== RECOMMENDATIONS ====================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💡 RECOMMENDATIONS\n');

    if (matchRate < 95) {
      console.log('   ⚠️ Match rate below target (95%)');
      console.log('      → Recruit more volunteers in underserved areas');
      console.log('      → Encourage donors to add more diverse resources\n');
    }

    if (activeVolunteers < totalVolunteers * 0.7) {
      console.log('   ⚠️ Low volunteer availability');
      console.log('      → Send notifications to inactive volunteers');
      console.log('      → Implement volunteer incentive program\n');
    }

    if (availableResources < 5) {
      console.log('   ⚠️ Low resource inventory');
      console.log('      → Launch donor recruitment campaign');
      console.log('      → Partner with local organizations\n');
    }

    if (healthScore >= 90) {
      console.log('   ✅ System performing excellently!');
      console.log('      → Continue monitoring key metrics');
      console.log('      → Consider scaling to new regions\n');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ ANALYTICS VERIFICATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error verifying analytics:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

verifyAnalytics();
