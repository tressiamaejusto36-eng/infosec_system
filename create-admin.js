/**
 * Browser Console Script to Create Admin User
 * 
 * Instructions:
 * 1. Open your browser's Developer Tools (F12)
 * 2. Go to the Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter to execute
 * 
 * This script will:
 * - Register a new user with the specified credentials
 * - The user will be created with 'user' role initially
 * - You'll need to manually update the role to 'admin' in the database
 * 
 * OR run the backend script (create-admin-backend.js) directly on the server
 */

(async function createAdmin() {
  const API_BASE_URL = 'http://localhost:5000/api';
  
  const adminCredentials = {
    name: 'Admin User',
    email: 'dumasmackie@gmail.com',
    password: 'dimahack123'
  };

  console.log('🚀 Starting admin user creation...');
  console.log('Email:', adminCredentials.email);

  try {
    // Step 1: Register the user
    console.log('\n📝 Step 1: Registering user...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminCredentials),
    });

    const registerData = await registerResponse.json();

    if (!registerResponse.ok) {
      if (registerResponse.status === 409) {
        console.log('⚠️  User already exists!');
        console.log('ℹ️  If you need to make this user an admin, run the backend script instead.');
        return;
      }
      throw new Error(registerData.message || 'Registration failed');
    }

    console.log('✅ User registered successfully!');
    console.log('User ID:', registerData.data.id);
    console.log('Current Role:', registerData.data.role);

    // Step 2: Instructions for making user admin
    console.log('\n⚠️  IMPORTANT: The user was created with "user" role.');
    console.log('📋 To make this user an admin, you have two options:\n');
    
    console.log('Option 1 - Using MongoDB Shell:');
    console.log('----------------------------');
    console.log('Run this command in your MongoDB shell or Compass:');
    console.log(`\ndb.users.updateOne(
  { email: "${adminCredentials.email}" },
  { $set: { role: "admin" } }
)\n`);

    console.log('Option 2 - Using the Backend Script:');
    console.log('-----------------------------------');
    console.log('Run the create-admin-backend.js script on your server:');
    console.log('node create-admin-backend.js\n');

    console.log('✨ Done! Remember to update the role to "admin" using one of the options above.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
})();
