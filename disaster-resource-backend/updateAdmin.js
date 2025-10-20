// updateAdmin.js - Update admin user with new fields
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function updateAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ email: 'admin@test.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }

    // Update admin with new fields
    admin.isApproved = true;
    admin.isActive = true;
    admin.verificationStatus = 'verified';
    
    await admin.save();

    console.log('✅ Admin user updated successfully!');
    console.log('');
    console.log('Admin Details:');
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Active:', admin.isActive);
    console.log('   Approved:', admin.isApproved);
    console.log('   Verification:', admin.verificationStatus);
    console.log('');
    console.log('Login credentials:');
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updateAdmin();
