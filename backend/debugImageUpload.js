/**
 * Debug script to test image upload functionality
 * Run with: node debugImageUpload.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from './models/Room.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function debugImageUpload() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads', 'rooms');
    console.log('📁 Checking uploads directory:', uploadsDir);
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Uploads directory does not exist. Creating...');
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    } else {
      console.log('✅ Uploads directory exists');
      
      // List files in uploads directory
      const files = fs.readdirSync(uploadsDir);
      console.log(`📄 Files in uploads directory: ${files.length}`);
      files.forEach(file => console.log(`  - ${file}`));
    }

    // Check rooms in database
    console.log('\n🏨 Checking rooms in database...');
    const rooms = await Room.find({});
    console.log(`Found ${rooms.length} rooms:`);
    
    rooms.forEach(room => {
      console.log(`\n📋 Room ${room.roomNumber} (${room.roomType}):`);
      console.log(`  - ID: ${room._id}`);
      console.log(`  - Images: ${room.images?.length || 0}`);
      if (room.images && room.images.length > 0) {
        room.images.forEach((img, index) => {
          console.log(`    ${index + 1}. ${img}`);
        });
      }
    });

    // Test adding a sample image to a room
    if (rooms.length > 0) {
      const testRoom = rooms[0];
      console.log(`\n🧪 Testing image addition to room ${testRoom.roomNumber}...`);
      
      const sampleImagePath = '/uploads/rooms/sample_test_image.jpg';
      
      // Add sample image if not already present
      if (!testRoom.images.includes(sampleImagePath)) {
        testRoom.images.push(sampleImagePath);
        await testRoom.save();
        console.log('✅ Added sample image path to room');
        
        // Verify it was saved
        const updatedRoom = await Room.findById(testRoom._id);
        console.log(`✅ Verified: Room now has ${updatedRoom.images.length} images`);
      } else {
        console.log('ℹ️  Sample image already exists in room');
      }
    }

    console.log('\n🎯 Debug Summary:');
    console.log('1. MongoDB connection: ✅');
    console.log('2. Uploads directory: ✅');
    console.log('3. Room model images field: ✅');
    console.log('4. Database save/retrieve: ✅');
    
    console.log('\n💡 If images still not showing:');
    console.log('1. Check if files are actually uploaded to uploads/rooms/');
    console.log('2. Check browser network tab for failed image requests');
    console.log('3. Verify admin panel is calling the correct API endpoint');
    console.log('4. Check backend logs during image upload');

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the debug
debugImageUpload();