import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    checkInDate: {
      type: Date,
      required: [true, "Check-in date is required"],
    },
    checkOutDate: {
      type: Date,
      required: [true, "Check-out date is required"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "checked-in", "checked-out"],
      default: "confirmed",
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    actualCheckInDate: {
      type: Date,
    },
    actualCheckOutDate: {
      type: Date,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    guestCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    specialRequests: {
      type: String,
      maxlength: 500,
      trim: true,
    },
  },
  { timestamps: true }
);

// No pre-save hooks - validation is handled in express-validator and controller

const Reservation = mongoose.model("Reservation", reservationSchema);
export default Reservation;