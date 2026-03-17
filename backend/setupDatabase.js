/**
 * Complete database setup script
 * Seeds rooms, inventory, and sample reservations
 * Run with: node setupDatabase.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Room from './models/Room.js';
import Reservation from './models/Reservation.js';
import Inventory from './models/Inventory.js';

dotenv.config();

// Sample rooms data
const sampleRooms = [
  {
    roomNumber: "101",
    roomType: "Standard",
    price: 150,
    capacity: 2,
    description: "Comfortable standard room with modern amenities",
    status: "available",
    images: []
  },
  {
    roomNumber: "102",
    roomType: "Standard", 
    price: 150,
    capacity: 2,
    description: "Cozy standard room perfect for couples",
    status: "available",
    images: []
  },
  {
    roomNumber: "201",
    roomType: "Deluxe",
    price: 250,
    capacity: 3,
    description: "Spacious deluxe room with city view",
    status: "available",
    images: []
  },
  {
    roomNumber: "202",
    roomType: "Deluxe",
    price: 250,
    capacity: 3,
    description: "Elegant deluxe room with premium furnishing",
    status: "available",
    images: []
  },
  {
    roomNumber: "301",
    roomType: "Suite",
    price: 400,
    capacity: 4,
    description: "Luxurious suite with separate living area",
    status: "available",
    images: []
  },
  {
    roomNumber: "401",
    roomType: "Presidential",
    price: 800,
    capacity: 6,
    description: "Ultimate luxury presidential suite",
    status: "available",
    images: []
  }
];

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Setup Rooms
    console.log('🏨 Setting up rooms...');
    await Room.deleteMany({});
    const createdRooms = await Room.insertMany(sampleRooms);
    console.log(`✅ Created ${createdRooms.length} rooms`);

    // 2. Check for users
    const users = await User.find({ role: 'user' });
    console.log(`👥 Found ${users.length} users`);

    if (users.length === 0) {
      console.log('⚠️  No regular users found. Creating a sample user...');
      const sampleUser = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: '$2b$10$example', // This won't work for login, just for seeding
        role: 'user',
        isVerified: true
      });
      users.push(sampleUser);
      console.log('✅ Created sample user');
    }

    // 3. Setup Sample Reservations
    console.log('📅 Setting up sample reservations...');
    await Reservation.deleteMany({});
    
    const reservations = [];
    const statuses = ['confirmed', 'completed', 'cancelled', 'pending'];
    const now = new Date();

    for (let i = 0; i < 15; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const room = createdRooms[Math.floor(Math.random() * createdRooms.length)];
      
      // Random date in the last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const checkInDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Stay duration 1-5 days
      const stayDuration = Math.floor(Math.random() * 5) + 1;
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
        createdAt: new Date(checkInDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });
    }

    const createdReservations = await Reservation.insertMany(reservations);
    console.log(`✅ Created ${createdReservations.length} reservations`);

    // 4. Setup Sample Inventory
    console.log('📦 Setting up sample inventory...');
    await Inventory.deleteMany({});

    const inventoryItems = [
      {
        roomId: createdRooms[0]._id,
        itemName: "Queen Size Bed",
        category: "Furniture",
        quantity: 1,
        minQuantity: 1,
        maxQuantity: 1,
        unitPrice: 800,
        condition: "Good",
        location: "Room 101"
      },
      {
        roomId: createdRooms[0]._id,
        itemName: "Smart TV 55\"",
        category: "Electronics",
        quantity: 1,
        minQuantity: 1,
        maxQuantity: 1,
        unitPrice: 650,
        condition: "New",
        location: "Room 101"
      },
      {
        roomId: createdRooms[1]._id,
        itemName: "King Size Bed",
        category: "Furniture",
        quantity: 1,
        minQuantity: 1,
        maxQuantity: 1,
        unitPrice: 1200,
        condition: "New",
        location: "Room 201"
      },
      {
        roomId: createdRooms[2]._id,
        itemName: "Premium Sofa Set",
        category: "Furniture",
        quantity: 1,
        minQuantity: 1,
        maxQuantity: 1,
        unitPrice: 1800,
        condition: "New",
        location: "Room 301"
      },
      {
        roomId: createdRooms[0]._id,
        itemName: "Towel Set",
        category: "Bathroom",
        quantity: 4,
        minQuantity: 2,
        maxQuantity: 6,
        unitPrice: 25,
        condition: "Good",
        location: "Room 101 Bathroom"
      },
      {
        roomId: createdRooms[0]._id,
        itemName: "Vacuum Cleaner",
        category: "Cleaning",
        quantity: 2,
        minQuantity: 1,
        maxQuantity: 3,
        unitPrice: 300,
        condition: "Good",
        location: "Housekeeping Storage"
      }
    ];

    const createdInventory = await Inventory.insertMany(inventoryItems);
    console.log(`✅ Created ${createdInventory.length} inventory items`);

    // 5. Summary
    console.log('\n📊 Database Setup Summary:');
    console.log(`🏨 Rooms: ${createdRooms.length}`);
    console.log(`📅 Reservations: ${createdReservations.length}`);
    console.log(`📦 Inventory Items: ${createdInventory.length}`);
    console.log(`👥 Users: ${users.length}`);

    const totalRevenue = createdReservations
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.totalPrice, 0);

    console.log(`💰 Total Revenue: $${totalRevenue.toLocaleString()}`);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Access the admin panel');
    console.log('2. View analytics dashboard');
    console.log('3. Manage inventory');
    console.log('4. See reservation data');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the setup
setupDatabase();