/**
 * Test script to verify booking functionality
 * Run with: node testBooking.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Reservation from './models/Reservation.js';
import Room from './models/Room.js';
import User from './models/User.js';

dotenv.config();

async function testBooking() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get a test user and room
    const user = await User.findOne({ role: 'user' });
    const room = await Room.findOne({ status: 'available' });

    if (!user) {
      console.log('❌ No user found. Please create a user first.');
      return;
    }

    if (!room) {
      console.log('❌ No available room found. Please create a room first.');
      return;
    }

    console.log('👤 Test user:', user.email);
    console.log('🏨 Test room:', room.roomNumber, room.roomType);

    // Test reservation data
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + 1); // Tomorrow
    
    const checkOutDate = new Date();
    checkOutDate.setDate(checkOutDate.getDate() + 3); // Day after tomorrow

    const reservationData = {
      userId: user._id,
      roomId: room._id,
      checkInDate,
      checkOutDate,
      totalPrice: room.price * 2, // 2 nights
      guestCount: 2,
      specialRequests: 'Test booking'
    };

    console.log('\n📅 Test reservation data:');
    console.log('- Check-in:', checkInDate.toISOString().split('T')[0]);
    console.log('- Check-out:', checkOutDate.toISOString().split('T')[0]);
    console.log('- Guests:', reservationData.guestCount);
    console.log('- Total price:', reservationData.totalPrice);

    // Try to create reservation
    console.log('\n🎯 Creating test reservation...');
    const reservation = await Reservation.create(reservationData);
    
    console.log('✅ Reservation created successfully!');
    console.log('- ID:', reservation._id);
    console.log('- Status:', reservation.status);
    console.log('- Created at:', reservation.createdAt);

    // Clean up - delete the test reservation
    await Reservation.findByIdAndDelete(reservation._id);
    console.log('🧹 Test reservation cleaned up');

    console.log('\n🎉 Booking functionality test PASSED!');
    console.log('The reservation model is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    
    if (error.name === 'ValidationError') {
      console.log('\n📋 Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.log(`- ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the test
testBooking();