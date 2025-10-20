// utils/smartMatching.js
const Resource = require('../models/Resource');
const User = require('../models/User');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Array} coord1 - [longitude, latitude]
 * @param {Array} coord2 - [longitude, latitude]
 * @returns {Number} Distance in kilometers
 */
function calculateDistance(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Smart Resource Matching Algorithm
 * Matches requests with resources based on multiple criteria:
 * 1. Resource type match
 * 2. Sufficient quantity
 * 3. Location proximity
 * 4. Donor rating/reliability
 * 5. Resource freshness (newer resources prioritized)
 * 6. Urgency-based prioritization
 * 
 * @param {Object} request - The resource request
 * @returns {Object} Best matching resource with score
 */
async function smartResourceMatch(request) {
  try {
    const { resourceType, quantity, urgency, location } = request;

    console.log(`\n🔍 Looking for resources:`);
    console.log(`   Type: "${resourceType}"`);
    console.log(`   Quantity needed: ${quantity}`);
    console.log(`   Status: available`);

    // Find all available resources of the requested type (case-insensitive)
    const availableResources = await Resource.find({
      type: { $regex: new RegExp(`^${resourceType}$`, 'i') }, // Case-insensitive match
      status: 'available', // Only available resources (including partially used ones)
      quantity: { $gte: quantity } // Must have sufficient quantity
    }).populate('donor', 'name rating ratingCount location');

    console.log(`   Found ${availableResources.length} matching resources`);

    if (availableResources.length === 0) {
      // Check if there are ANY resources (for debugging)
      const allResources = await Resource.find({ status: 'available' });
      console.log(`   ⚠️ No exact match. Available resource types:`);
      allResources.forEach(r => console.log(`      - "${r.type}" (qty: ${r.quantity})`));
      return null; // No matching resources found
    }

    // Score each resource based on multiple criteria
    const scoredResources = availableResources.map(resource => {
      let score = 0;
      const weights = {
        proximity: 40,    // 40% weight for location proximity
        quantity: 20,     // 20% weight for quantity match
        donorRating: 20,  // 20% weight for donor reliability
        freshness: 10,    // 10% weight for resource age
        urgency: 10       // 10% weight for urgency-based bonus
      };

      // 1. PROXIMITY SCORE (0-40 points)
      // Since location is now text, give default proximity score
      let proximityScore = weights.proximity * 0.5; // Default 50% score
      score += proximityScore;

      // 2. QUANTITY MATCH SCORE (0-20 points)
      // Prefer resources that closely match the requested quantity
      const quantityRatio = quantity / resource.quantity;
      let quantityScore = 0;
      
      if (quantityRatio >= 0.8 && quantityRatio <= 1.2) {
        // Perfect match (80-120% of requested)
        quantityScore = weights.quantity;
      } else if (quantityRatio >= 0.5 && quantityRatio <= 1.5) {
        // Good match (50-150% of requested)
        quantityScore = weights.quantity * 0.7;
      } else {
        // Acceptable but not ideal
        quantityScore = weights.quantity * 0.4;
      }
      
      score += quantityScore;

      // 3. DONOR RATING SCORE (0-20 points)
      // Higher-rated donors get priority
      const donorRating = resource.donor.rating || 0;
      const donorRatingCount = resource.donor.ratingCount || 0;
      
      // Normalize rating (0-5 scale to 0-20 points)
      let ratingScore = (donorRating / 5) * weights.donorRating;
      
      // Bonus for donors with many ratings (more reliable)
      if (donorRatingCount >= 10) ratingScore *= 1.2;
      else if (donorRatingCount >= 5) ratingScore *= 1.1;
      
      score += Math.min(ratingScore, weights.donorRating);

      // 4. FRESHNESS SCORE (0-10 points)
      // Newer resources get higher priority
      const resourceAge = Date.now() - new Date(resource.createdAt).getTime();
      const ageInDays = resourceAge / (1000 * 60 * 60 * 24);
      
      let freshnessScore = 0;
      if (ageInDays <= 1) freshnessScore = weights.freshness;
      else if (ageInDays <= 3) freshnessScore = weights.freshness * 0.8;
      else if (ageInDays <= 7) freshnessScore = weights.freshness * 0.6;
      else if (ageInDays <= 14) freshnessScore = weights.freshness * 0.4;
      else freshnessScore = weights.freshness * 0.2;
      
      score += freshnessScore;

      // 5. URGENCY BONUS (0-10 points)
      // High urgency requests get bonus
      if (urgency === 'high') {
        score += weights.urgency;
      } else if (urgency === 'medium') {
        score += weights.urgency * 0.5;
      }

      return {
        resource,
        score,
        distance: 0,
        breakdown: {
          proximityScore: proximityScore.toFixed(2),
          quantityScore: quantityScore.toFixed(2),
          ratingScore: Math.min(ratingScore, weights.donorRating).toFixed(2),
          freshnessScore: freshnessScore.toFixed(2),
          urgencyBonus: urgency === 'high' ? weights.urgency : urgency === 'medium' ? weights.urgency * 0.5 : 0,
          totalScore: score.toFixed(2)
        }
      };
    });

    // Sort by score (highest first)
    scoredResources.sort((a, b) => b.score - a.score);

    // Return the best match
    const bestMatch = scoredResources[0];
    
    console.log('Smart Matching Results:');
    console.log(`Found ${scoredResources.length} potential matches`);
    console.log(`Best match: ${bestMatch.resource.type} from ${bestMatch.resource.donor.name}`);
    console.log(`Score: ${bestMatch.score.toFixed(2)}/100`);
    console.log('Score breakdown:', bestMatch.breakdown);

    return bestMatch;
  } catch (err) {
    console.error('Smart matching error:', err);
    return null;
  }
}

/**
 * Find best volunteer for a delivery task
 * Considers: proximity to donor, availability, rating, workload
 * 
 * @param {Object} resource - The resource to be delivered
 * @param {Object} request - The request details
 * @returns {Object} Best volunteer with score
 */
async function smartVolunteerMatch(resource, request) {
  try {
    console.log(`\n🔍 Looking for volunteers:`);
    console.log(`   Role: volunteer`);
    console.log(`   Availability: true`);
    console.log(`   Active: true`);
    console.log(`   Approved: true`);

    // Find all available volunteers
    const volunteers = await User.find({ 
      role: 'volunteer', 
      availability: true,
      isActive: true,
      isApproved: true
    });

    console.log(`   Found ${volunteers.length} available volunteers`);

    if (volunteers.length === 0) {
      // Check all volunteers for debugging
      const allVolunteers = await User.find({ role: 'volunteer' });
      console.log(`   ⚠️ No available volunteers. All volunteers:`);
      allVolunteers.forEach(v => {
        console.log(`      - ${v.name}: available=${v.availability}, active=${v.isActive}, approved=${v.isApproved}`);
      });
      return null;
    }

    const DeliveryTask = require('../models/DeliveryTask');

    // Score each volunteer (text-based location system)
    const scoredVolunteers = await Promise.all(volunteers.map(async (volunteer) => {
      let score = 0;
      const weights = {
        proximityToDonor: 40,    // 40% - Close to pickup location
        proximityToRequester: 20, // 20% - Close to delivery location
        rating: 25,               // 25% - Volunteer rating
        workload: 15              // 15% - Current workload
      };

      // 1. PROXIMITY TO DONOR (Pickup location) - Default score since location is text
      let donorProximityScore = weights.proximityToDonor * 0.5;
      score += donorProximityScore;

      // 2. PROXIMITY TO REQUESTER (Delivery location) - Default score since location is text
      let requesterProximityScore = weights.proximityToRequester * 0.5;
      score += requesterProximityScore;

      // 3. VOLUNTEER RATING
      const rating = volunteer.rating || 0;
      const ratingCount = volunteer.ratingCount || 0;
      
      let ratingScore = (rating / 5) * weights.rating;
      if (ratingCount >= 10) ratingScore *= 1.2;
      else if (ratingCount >= 5) ratingScore *= 1.1;
      
      score += Math.min(ratingScore, weights.rating);

      // 4. WORKLOAD (fewer active tasks = higher score)
      const activeTasks = await DeliveryTask.countDocuments({
        volunteer: volunteer._id,
        status: { $in: ['assigned', 'accepted', 'in-progress'] }
      });
      
      let workloadScore = 0;
      if (activeTasks === 0) workloadScore = weights.workload;
      else if (activeTasks === 1) workloadScore = weights.workload * 0.7;
      else if (activeTasks === 2) workloadScore = weights.workload * 0.4;
      else workloadScore = weights.workload * 0.2;
      
      score += workloadScore;

      // URGENCY BONUS for high-priority requests
      if (request.urgency === 'high') {
        score += 10; // Bonus for urgent requests
      }

      return {
        volunteer,
        score,
        distanceToDonor: 0,
        distanceToRequester: 0,
        activeTasks,
        breakdown: {
          donorProximityScore: donorProximityScore.toFixed(2),
          requesterProximityScore: requesterProximityScore.toFixed(2),
          ratingScore: Math.min(ratingScore, weights.rating).toFixed(2),
          workloadScore: workloadScore.toFixed(2),
          totalScore: score.toFixed(2)
        }
      };
    }));

    // Sort by score
    scoredVolunteers.sort((a, b) => b.score - a.score);

    const bestVolunteer = scoredVolunteers[0];
    
    console.log('Smart Volunteer Matching:');
    console.log(`Found ${scoredVolunteers.length} available volunteers`);
    console.log(`Best match: ${bestVolunteer.volunteer.name}`);
    console.log(`Score: ${bestVolunteer.score.toFixed(2)}/100`);
    console.log(`Active tasks: ${bestVolunteer.activeTasks}`);

    return bestVolunteer;
  } catch (err) {
    console.error('Smart volunteer matching error:', err);
    return null;
  }
}

module.exports = {
  smartResourceMatch,
  smartVolunteerMatch,
  calculateDistance
};
