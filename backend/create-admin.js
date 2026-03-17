/**
 * Backend Script to Create Admin User
 * 
 * Run this script from the backend directory with: node create-admin.js
 * 
 * This script will:
 * - Connect to your MongoDB database
 * - Create or update a user with admin role
 * - Handle the case where the user already exists
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load environment variables
dotenv.config();

const adminCredentials = {
  name: 'Admin User',
  email: 'ttisyamaee@gmail.com',
  password: 'dimahack123',
  role: 'admin'
};

async function createAdminUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if user already exists
    const existingUser = await User.findOne({ email: adminCredentials.email });

    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log('Current role:', existingUser.role);
      
      if (existingUser.role === 'admin') {
        console.log('✅ User is already an admin. Nothing to do.');
      } else {
        console.log('📝 Updating user role to admin...');
        existingUser.role = 'admin';
        await existingUser.save();
        console.log('✅ User role updated to admin successfully!');
      }
    } else {
      console.log('📝 Creating new admin user...');
      
      // Create new admin user
      const adminUser = await User.create(adminCredentials);
      
      console.log('✅ Admin user created successfully!');
      console.log('\nUser Details:');
      console.log('- ID:', adminUser._id);
      console.log('- Name:', adminUser.name);
      console.log('- Email:', adminUser.email);
      console.log('- Role:', adminUser.role);
    }

    console.log('\n🎉 All done!');
    console.log('\nYou can now login with:');
    console.log('Email:', adminCredentials.email);
    console.log('Password:', adminCredentials.password);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
createAdminUser();
