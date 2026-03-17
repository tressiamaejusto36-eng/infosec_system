/**
 * Script to seed sample inventory data
 * Run with: node seedInventory.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from './models/Room.js';
import Inventory from './models/Inventory.js';

dotenv.config();

const sampleInventoryItems = [
  // Standard Room (101) Items
  {
    itemName: "Queen Size Bed",
    category: "Furniture",
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 1,
    unitPrice: 800,
    supplier: {
      name: "Hotel Furniture Co.",
      contact: "+1-555-0101",
      email: "sales@hotelfurniture.com"
    },
    condition: "Good",
    location: "Room 101",
    barcode: "BED-101-001",
    notes: "Comfortable queen bed with premium mattress"
  },
  {
    itemName: "Bedsheets Set",
    category: "Linens",
    quantity: 3,
    minQuantity: 2,
    maxQuantity: 5,
    unitPrice: 45,
    supplier: {
      name: "Luxury Linens Ltd.",
      contact: "+1-555-0102",
      email: "orders@luxurylinens.com"
    },
    condition: "Good",
    location: "Room 101",
    barcode: "LINEN-101-001"
  },
  {
    itemName: "Smart TV 55\"",
    category: "Electronics",
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 1,
    unitPrice: 650,
    supplier: {
      name: "Tech Solutions Inc.",
      contact: "+1-555-0103",
      email: "support@techsolutions.com"
    },
    condition: "New",
    location: "Room 101",
    barcode: "TV-101-001",
    warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    nextMaintenanceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months
  },
  {
    itemName: "Mini Fridge",
    category: "Electronics",
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 1,
    unitPrice: 200,
    supplier: {
      name: "Appliance World",
      contact: "+1-555-0104",
      email: "sales@applianceworld.com"
    },
    condition: "Good",
    location: "Room 101",
    barcode: "FRIDGE-101-001"
  },
  {
    itemName: "Towel Set",
    category: "Bathroom",
    quantity: 4,
    minQuantity: 2,
    maxQuantity: 6,
    unitPrice: 25,
    supplier: {
      name: "Luxury Linens Ltd.",
      contact: "+1-555-0102",
      email: "orders@luxurylinens.com"
    },
    condition: "Good",
    location: "Room 101 Bathroom",
    barcode: "TOWEL-101-001"
  },
  {
    itemName: "Coffee Maker",
    category: "Kitchen",
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 1,
    unitPrice: 80,
    supplier: {
      name: "Kitchen Essentials",
      contact: "+1-555-0105",
      email: "info@kitchenessentials.com"
    },
    condition: "Good",
    location: "Room 101",
    barcode: "COFFEE-101-001"
  },
  // Deluxe Room (201) Items
  {
    itemName: "King Size Bed",
    category: "Furniture",
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 1,
    unitPrice: 1200,
    supplier: {
      name: "Premium Hotel Furniture",
      contact: "+1-555-0201",
      email: "sales@premiumhotelfurniture.com"
    },
    condition: "New",
    location: "Room 201",
    barcode: "BED-201-001"
  },
  {
    itemName: "Luxury Bedsheets Set",
    category: "Linens",
    quantity: 2,
    minQuantity: 2,
    maxQuantity: 4,
    unitPrice: 85,
    supplier: {
      name: "Luxury Linens Ltd.",
      contact: "+1-555-0102",
      email: "orders@luxurylinens.com"
    },
    condition: "New",
    location: "Room 201",
    barcode: "LINEN-201-001"
  },
  {
    itemName: "Smart TV 65\"",
    category: "Electronics",
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 1,
    unitPrice: 950,
    supplier: {
      name: "Tech Solutions Inc.",
      contact: "+1-555-0103",
      email: "support@techsolutions.com"
    },
    condition: "New",
    location: "Room 201",
    barcode: "TV-201-001",
    warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  },
  {
    itemName: "Mini Bar",
    category: "Kitchen",
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 1,
    unitPrice: 400,
    supplier: {
      name: "Appliance World",
      contact: "+1-555-0104",
      email: "sales@applianceworld.com"
    },
    condition: "Good",
    location: "Room 201",
    barcode: "MINIBAR-201-001"
  },
  // Suite (301) Items
  {
    itemName: "Premium Sofa Set",
    category: "Furniture",
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 1,
    unitPrice: 1800,
    supplier: {
      name: "Luxury Furniture Co.",
      contact: "+1-555-0301",
      email: "sales@luxuryfurniture.com"
    },
    condition: "New",
    location: "Room 301 Living Area",
    barcode: "SOFA-301-001"
  },
  {
    itemName: "Jacuzzi Tub",
    category: "Bathroom",
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 1,
    unitPrice: 3500,
    supplier: {
      name: "Spa Equipment Ltd.",
      contact: "+1-555-0302",
      email: "info@spaequipment.com"
    },
    condition: "New",
    location: "Room 301 Bathroom",
    barcode: "JACUZZI-301-001",
    nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month
  },
  // Presidential Suite (401) Items
  {
    itemName: "Grand Piano",
    category: "Furniture",
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 1,
    unitPrice: 15000,
    supplier: {
      name: "Musical Instruments Inc.",
      contact: "+1-555-0401",
      email: "sales@musicalinstruments.com"
    },
    condition: "New",
    location: "Room 401 Living Room",
    barcode: "PIANO-401-001",
    nextMaintenanceDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 2 months
  },
  {
    itemName: "Crystal Chandelier",
    category: "Furniture",
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 1,
    unitPrice: 5000,
    supplier: {
      name: "Luxury Lighting Co.",
      contact: "+1-555-0402",
      email: "orders@luxurylighting.com"
    },
    condition: "Good",
    location: "Room 401 Dining Room",
    barcode: "CHANDELIER-401-001"
  },
  // Common/Maintenance Items
  {
    itemName: "Vacuum Cleaner",
    category: "Cleaning",
    quantity: 2,
    minQuantity: 1,
    maxQuantity: 3,
    unitPrice: 300,
    supplier: {
      name: "Cleaning Supplies Co.",
      contact: "+1-555-0501",
      email: "sales@cleaningsupplies.com"
    },
    condition: "Good",
    location: "Housekeeping Storage",
    barcode: "VACUUM-001"
  },
  {
    itemName: "Fire Extinguisher",
    category: "Safety",
    quantity: 8,
    minQuantity: 4,
    maxQuantity: 12,
    unitPrice: 45,
    supplier: {
      name: "Safety First Inc.",
      contact: "+1-555-0502",
      email: "orders@safetyfirst.com"
    },
    condition: "Good",
    location: "Various Locations",
    barcode: "EXTINGUISHER-001",
    nextMaintenanceDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months
  }
];

async function seedInventory() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get existing rooms
    const rooms = await Room.find({});
    if (rooms.length === 0) {
      console.log('❌ No rooms found. Please run seedRooms.js first.');
      process.exit(1);
    }

    console.log(`📋 Found ${rooms.length} rooms`);

    // Clear existing inventory
    console.log('🧹 Clearing existing inventory...');
    await Inventory.deleteMany({});

    // Map room numbers to IDs
    const roomMap = {};
    rooms.forEach(room => {
      roomMap[room.roomNumber] = room._id;
    });

    // Assign room IDs to inventory items
    const inventoryWithRoomIds = sampleInventoryItems.map(item => {
      let roomId;
      
      // Determine room ID based on item location or barcode
      if (item.barcode.includes('101') || item.location.includes('101')) {
        roomId = roomMap['101'];
      } else if (item.barcode.includes('201') || item.location.includes('201')) {
        roomId = roomMap['201'];
      } else if (item.barcode.includes('301') || item.location.includes('301')) {
        roomId = roomMap['301'];
      } else if (item.barcode.includes('401') || item.location.includes('401')) {
        roomId = roomMap['401'];
      } else {
        // For common items, assign to first room
        roomId = rooms[0]._id;
      }

      return {
        ...item,
        roomId
      };
    });

    // Insert inventory items
    console.log('📦 Creating inventory items...');
    const createdItems = await Inventory.insertMany(inventoryWithRoomIds);

    console.log('✅ Inventory items created successfully!\n');
    console.log('Created items by category:');
    
    const categoryStats = {};
    createdItems.forEach(item => {
      categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
    });

    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`- ${category}: ${count} items`);
    });

    console.log(`\n📊 Total items: ${createdItems.length}`);
    console.log(`💰 Total inventory value: $${createdItems.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}`);

    console.log('\n🎉 Inventory seeded successfully!');
    console.log('\nYou can now:');
    console.log('1. View inventory analytics via /api/analytics/inventory');
    console.log('2. Manage inventory items via admin panel');
    console.log('3. Track stock levels and maintenance schedules');

  } catch (error) {
    console.error('❌ Error seeding inventory:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeder
seedInventory();