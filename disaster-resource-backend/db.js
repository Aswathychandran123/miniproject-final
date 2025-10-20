// db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(' MongoDB Connected Successfully');
  } catch (err) {
    console.error(' MongoDB Connection Error:', err.message);
    console.error('Please check:');
    console.error('1. Internet connection');
    console.error('2. MongoDB Atlas cluster is running');
    console.error('3. IP address is whitelisted in MongoDB Atlas');
    console.error('4. Credentials are correct in .env file');
    process.exit(1);
  }
};

module.exports = connectDB;