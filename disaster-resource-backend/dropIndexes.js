// Drop geospatial indexes before migration
require('dotenv').config();
const mongoose = require('mongoose');

async function dropIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Drop indexes from resources collection
    try {
      const resourcesCollection = db.collection('resources');
      await resourcesCollection.dropIndex('location_2dsphere');
      console.log('✓ Dropped location_2dsphere index from resources');
    } catch (err) {
      console.log('  (resources index may not exist, skipping)');
    }

    // Drop indexes from requests collection
    try {
      const requestsCollection = db.collection('requests');
      await requestsCollection.dropIndex('location_2dsphere');
      console.log('✓ Dropped location_2dsphere index from requests');
    } catch (err) {
      console.log('  (requests index may not exist, skipping)');
    }

    console.log('\n✅ Indexes dropped successfully!');
    console.log('Now run: node migrateLocations.js');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropIndexes();
