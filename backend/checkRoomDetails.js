import mongoose from "mongoose";
import dotenv from "dotenv";
import Room from "./models/Room.js";
import connectDB from "./db.js";

dotenv.config();

async function checkRoomDetails() {
  try {
    await connectDB();
    console.log("🔍 Checking room details...\n");

    const rooms = await Room.find({});
    
    console.log(`Found ${rooms.length} rooms:\n`);
    
    rooms.forEach(room => {
      console.log(`Room ID: ${room._id}`);
      console.log(`Room Number: ${room.roomNumber}`);
      console.log(`Room Type: ${room.roomType}`);
      console.log(`Price: $${room.price}`);
      console.log(`Base Price: $${room.basePrice || 'NOT SET'}`);
      console.log(`Images: ${room.images?.length || 0}`);
      if (room.images && room.images.length > 0) {
        room.images.forEach((img, idx) => {
          console.log(`  ${idx + 1}. ${img}`);
        });
      }
      console.log('---\n');
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkRoomDetails();
