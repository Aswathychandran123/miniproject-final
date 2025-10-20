// testLogin.js - Test admin login
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function testLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@test.com' });
    
    if (!admin) {
      console.log('❌ Admin user NOT found!');
      console.log('Run: node createAdmin.js');
      process.exit(1);
    }

    console.log('✅ Admin user found:');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
    console.log('   Active:', admin.isActive);
    console.log('   Approved:', admin.isApproved);
    console.log('   Verification:', admin.verificationStatus);
    console.log('');

    // Test password
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    
    if (isMatch) {
      console.log('✅ Password verification: SUCCESS');
      console.log('   Password "admin123" is correct');
    } else {
      console.log('❌ Password verification: FAILED');
      console.log('   Password "admin123" does not match');
    }

    console.log('');
    console.log('📝 Login Credentials:');
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🌐 Backend URL: http://localhost:5001');
    console.log('🌐 Frontend URL: http://localhost:3000');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testLogin();
