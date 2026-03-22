import mongoose from "mongoose";
import dotenv from "dotenv";
import Room from "./models/Room.js";
import connectDB from "./db.js";

dotenv.config();

/**
 * Migration script to add basePrice to existing rooms
 * Run this once after updating the Room model
 */
async function migrateRoomPrices() {
  try {
    await connectDB();
    console.log("🔄 Starting room price migration...");

    const rooms = await Room.find();
    console.log(`📊 Found ${rooms.length} rooms to migrate`);

    let updated = 0;
    for (const room of rooms) {
      if (!room.basePrice) {
        room.basePrice = room.price;
        await room.save();
        updated++;
        console.log(`✅ Updated room ${room.roomNumber}: basePrice = ${room.basePrice}`);
      }
    }

    console.log(`\n✨ Migration complete! Updated ${updated} rooms.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateRoomPrices();
