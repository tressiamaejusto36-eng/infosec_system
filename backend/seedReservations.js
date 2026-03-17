/**
 * Script to seed sample reservation data for analytics
 * Run with: node seedReservations.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Room from './models/Room.js';
import Reservation from './models/Reservation.js';

dotenv.config();

async function seedReservations() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get existing users and rooms
    const users = await User.find({ role: 'user' });
    const rooms = await Room.find({});

    if (users.length === 0) {
      console.log('❌ No users found. Please create some users first.');
      process.exit(1);
    }

    if (rooms.length === 0) {
      console.log('❌ No rooms found. Please run seedRooms.js first.');
      process.exit(1);
    }

    console.log(`👥 Found ${users.length} users`);
    console.log(`🏨 Found ${rooms.length} rooms`);

    // Clear existing reservations
    console.log('🧹 Clearing existing reservations...');
    await Reservation.deleteMany({});

    // Create sample reservations for the last 30 days
    const reservations = [];
    const statuses = ['confirmed', 'completed', 'cancelled', 'pending'];
    const now = new Date();

    for (let i = 0; i < 20; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      
      // Random date in the last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const checkInDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Stay duration 1-7 days
      const stayDuration = Math.floor(Math.random() * 7) + 1;
      const checkOutDate = new Date(checkInDate.getTime() + stayDuration * 24 * 60 * 60 * 1000);
      
      const totalPrice = room.price * stayDuration;
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      reservations.push({
        userId: user._id,
        roomId: room._id,
        checkInDate,
        checkOutDate,
        totalPrice,
        status,
        createdAt: new Date(checkInDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Created up to 7 days before check-in
      });
    }

    // Insert reservations
    console.log('📅 Creating sample reservations...');
    const createdReservations = await Reservation.insertMany(reservations);

    console.log('✅ Reservations created successfully!\n');
    console.log('Created reservations by status:');
    
    const statusStats = {};
    createdReservations.forEach(reservation => {
      statusStats[reservation.status] = (statusStats[reservation.status] || 0) + 1;
    });

    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} reservations`);
    });

    const totalRevenue = createdReservations
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.totalPrice, 0);

    console.log(`\n📊 Total reservations: ${createdReservations.length}`);
    console.log(`💰 Total revenue: $${totalRevenue.toLocaleString()}`);

    console.log('\n🎉 Reservations seeded successfully!');
    console.log('\nYou can now:');
    console.log('1. View analytics in the admin panel');
    console.log('2. See revenue and occupancy data');
    console.log('3. Test the analytics dashboard');

  } catch (error) {
    console.error('❌ Error seeding reservations:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeder
seedReservations();