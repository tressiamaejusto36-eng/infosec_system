import mongoose from "mongoose";
import dotenv from "dotenv";
import Room from "./models/Room.js";
import connectDB from "./db.js";

dotenv.config();

async function fixRoomImages() {
  try {
    await connectDB();
    console.log("🔧 Fixing room images and basePrice...\n");

    const rooms = await Room.find({});
    
    console.log(`Found ${rooms.length} rooms to fix:\n`);
    
    for (const room of rooms) {
      let updated = false;
      
      // Fix basePrice if missing
      if (!room.basePrice) {
        room.basePrice = room.price;
        updated = true;
        console.log(`✅ Set basePrice for room ${room.roomNumber}: $${room.basePrice}`);
      }
      
      // Add sample images if none exist
      if (!room.images || room.images.length === 0) {
        // Use Unsplash images as placeholders
        const sampleImages = {
          'Standard': [
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80'
          ],
          'Deluxe': [
            'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
            'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80'
          ],
          'Suite': [
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'
          ],
          'Presidential': [
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
            'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80'
          ]
        };
        
        room.images = sampleImages[room.roomType] || sampleImages['Standard'];
        updated = true;
        console.log(`✅ Added ${room.images.length} sample images for room ${room.roomNumber}`);
      }
      
      if (updated) {
        await room.save();
        console.log(`💾 Saved room ${room.roomNumber}\n`);
      }
    }

    console.log("\n✨ All rooms fixed!");
    console.log("\nYou can now:");
    console.log("1. View rooms with images in the frontend");
    console.log("2. Upload custom images via admin panel to replace sample images");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixRoomImages();
