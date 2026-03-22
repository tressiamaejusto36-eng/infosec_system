import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      unique: true,
      trim: true,
    },
    roomType: {
      type: String,
      required: [true, "Room type is required"],
      enum: ["Standard", "Deluxe", "Suite", "Presidential"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price per night is required"],
      min: [0, "Price cannot be negative"],
    },
    basePrice: {
      type: Number,
      required: false,
      min: [0, "Base price cannot be negative"],
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: 1,
    },
    status: {
      type: String,
      enum: ["available", "reserved", "maintenance", "cleaning"],
      default: "available",
    },
    housekeepingStatus: {
      type: String,
      enum: ["clean", "dirty", "in-progress", "inspected"],
      default: "clean",
    },
    lastCleaned: {
      type: Date,
      default: Date.now,
    },
    assignedHousekeeper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    images: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);
export default Room;
