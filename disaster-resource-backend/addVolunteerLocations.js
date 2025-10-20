// addVolunteerLocations.js
// Script to add location data to volunteers who don't have it

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function addVolunteerLocations() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all volunteers without location
    const volunteersWithoutLocation = await User.find({
      role: 'volunteer',
      $or: [
        { location: { $exists: false } },
        { 'location.coordinates': { $exists: false } },
        { 'location.coordinates.0': null }
      ]
    });

    console.log(`Found ${volunteersWithoutLocation.length} volunteers without location`);

    if (volunteersWithoutLocation.length === 0) {
      console.log('All volunteers have location data!');
      
      // Show all volunteers with their locations
      const allVolunteers = await User.find({ role: 'volunteer' });
      console.log('\nAll Volunteers:');
      allVolunteers.forEach(v => {
        console.log(`- ${v.name} (${v.email}): ${v.location ? `[${v.location.coordinates}]` : 'NO LOCATION'}`);
        console.log(`  Available: ${v.availability}, Approved: ${v.isApproved}`);
      });
      
      process.exit(0);
      return;
    }

    // Default location (you can change this)
    const defaultLocation = {
      type: 'Point',
      coordinates: [76.67, 10.79] // [longitude, latitude] - Adjust as needed
    };

    console.log('\nAdding default location to volunteers:');
    console.log(`Location: [${defaultLocation.coordinates[0]}, ${defaultLocation.coordinates[1]}]`);
    console.log('(You can change this in the script)\n');

    for (const volunteer of volunteersWithoutLocation) {
      volunteer.location = defaultLocation;
      volunteer.availability = true; // Also set availability to true
      await volunteer.save();
      console.log(`✓ Updated ${volunteer.name} (${volunteer.email})`);
    }

    console.log(`\n✅ Successfully updated ${volunteersWithoutLocation.length} volunteers`);
    console.log('\nNow try submitting a new request - it should automatically match!');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

addVolunteerLocations();
