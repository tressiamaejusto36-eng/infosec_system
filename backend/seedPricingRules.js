import mongoose from "mongoose";
import dotenv from "dotenv";
import PricingRule from "./models/PricingRule.js";
import connectDB from "./db.js";

dotenv.config();

const samplePricingRules = [
  {
    name: "Weekend Premium",
    roomType: "all",
    ruleType: "weekend",
    priceModifier: 20,
    priority: 5,
    isActive: true,
  },
  {
    name: "Summer Season",
    roomType: "all",
    ruleType: "seasonal",
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-08-31"),
    priceModifier: 25,
    priority: 10,
    isActive: true,
  },
  {
    name: "Holiday Season",
    roomType: "all",
    ruleType: "seasonal",
    startDate: new Date("2024-12-20"),
    endDate: new Date("2025-01-05"),
    priceModifier: 40,
    priority: 15,
    isActive: true,
  },
  {
    name: "High Occupancy Surge",
    roomType: "all",
    ruleType: "occupancy",
    minOccupancy: 80,
    maxOccupancy: 100,
    priceModifier: 15,
    priority: 8,
    isActive: true,
  },
  {
    name: "Weekday Discount",
    roomType: "all",
    ruleType: "weekday",
    daysOfWeek: [1, 2, 3, 4], // Monday-Thursday
    priceModifier: -10,
    priority: 3,
    isActive: true,
  },
  {
    name: "Presidential Suite Premium",
    roomType: "Presidential",
    ruleType: "special-event",
    startDate: new Date("2024-07-01"),
    endDate: new Date("2024-07-15"),
    priceModifier: 30,
    priority: 12,
    isActive: true,
  },
];

async function seedPricingRules() {
  try {
    await connectDB();
    console.log("🔄 Seeding pricing rules...");

    // Clear existing rules
    await PricingRule.deleteMany({});
    console.log("🗑️  Cleared existing pricing rules");

    // Insert sample rules
    const rules = await PricingRule.insertMany(samplePricingRules);
    console.log(`✅ Created ${rules.length} pricing rules:`);
    
    rules.forEach(rule => {
      console.log(`   - ${rule.name} (${rule.ruleType}): ${rule.priceModifier > 0 ? '+' : ''}${rule.priceModifier}%`);
    });

    console.log("\n✨ Pricing rules seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedPricingRules();
