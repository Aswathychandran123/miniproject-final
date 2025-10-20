// createAdmin.js - Quick script to create admin user
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    if (existingAdmin) {
      console.log('❌ Admin user already exists!');
      console.log('Email: admin@test.com');
      console.log('You can login with this account.');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      location: {
        type: 'Point',
        coordinates: [0, 0]
      },
      availability: true,
      rating: 0,
      ratingCount: 0,
      isApproved: true,
      isActive: true,
      verificationStatus: 'verified'
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');
    console.log('');
    console.log('You can now login to the admin dashboard!');

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();
