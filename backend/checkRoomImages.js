import mongoose from "mongoose";
import dotenv from "dotenv";
import Room from "./models/Room.js";
import connectDB from "./db.js";

dotenv.config();

async function checkRoomImages() {
  try {
    await connectDB();
    console.log("🔍 Checking room images...\n");

    const rooms = await Room.find({}, "roomNumber roomType images").limit(10);
    
    console.log(`Found ${rooms.length} rooms:\n`);
    
    rooms.forEach(room => {
      console.log(`Room ${room.roomNumber} (${room.roomType}):`);
      console.log(`  Images: ${room.images?.length || 0}`);
      if (room.images && room.images.length > 0) {
        room.images.forEach((img, idx) => {
          console.log(`    ${idx + 1}. ${img}`);
        });
      } else {
        console.log(`    ❌ No images`);
      }
      console.log();
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkRoomImages();
