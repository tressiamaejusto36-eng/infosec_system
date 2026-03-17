/**
 * Script to seed sample rooms with images
 * Run with: node seedRooms.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from './models/Room.js';

dotenv.config();

const sampleRooms = [
  {
    roomNumber: "101",
    roomType: "Standard",
    price: 120,
    capacity: 2,
    status: "available",
    description: "Comfortable standard room with modern amenities, perfect for couples or business travelers.",
    images: [
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Free WiFi", "Air Conditioning", "TV", "Mini Fridge", "Coffee Maker"]
  },
  {
    roomNumber: "201",
    roomType: "Deluxe",
    price: 180,
    capacity: 3,
    status: "available",
    description: "Spacious deluxe room with city view, featuring premium furnishings and enhanced comfort.",
    images: [
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Free WiFi", "Air Conditioning", "Smart TV", "Mini Bar", "Room Service", "City View"]
  },
  {
    roomNumber: "301",
    roomType: "Suite",
    price: 280,
    capacity: 4,
    status: "available",
    description: "Luxurious suite with separate living area, perfect for extended stays and special occasions.",
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Free WiFi", "Air Conditioning", "Smart TV", "Mini Bar", "Room Service", "Balcony", "Separate Living Area"]
  },
  {
    roomNumber: "401",
    roomType: "Presidential",
    price: 450,
    capacity: 6,
    status: "available",
    description: "The ultimate luxury experience with panoramic views, premium amenities, and personalized service.",
    images: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Free WiFi", "Air Conditioning", "Smart TV", "Full Bar", "24/7 Room Service", "Panoramic View", "Jacuzzi", "Butler Service"]
  }
];

async function seedRooms() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing rooms
    console.log('🧹 Clearing existing rooms...');
    await Room.deleteMany({});

    // Insert sample rooms
    console.log('📝 Creating sample rooms...');
    const createdRooms = await Room.insertMany(sampleRooms);

    console.log('✅ Sample rooms created successfully!\n');
    console.log('Created rooms:');
    createdRooms.forEach(room => {
      console.log(`- Room ${room.roomNumber} (${room.roomType}) - $${room.price}/night`);
    });

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nYou can now:');
    console.log('1. View rooms in the frontend');
    console.log('2. Upload custom images via admin panel');
    console.log('3. Book rooms as a user');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeder
seedRooms();