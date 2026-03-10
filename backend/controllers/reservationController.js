import { body } from "express-validator";
import mongoose from "mongoose";
import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";
import { validateQueryParams } from "../utils/security.js";

// ─── Validation Rules ─────────────────────────────────────────
export const reservationValidation = [
  body("roomId").notEmpty().withMessage("Room ID is required").isMongoId().withMessage("Invalid room ID"),
  body("checkInDate")
    .notEmpty().withMessage("Check-in date is required")
    .isISO8601().withMessage("Invalid check-in date format")
    .custom((val) => new Date(val) >= new Date(new Date().setHours(0,0,0,0)))
    .withMessage("Check-in date cannot be in the past"),
  body("checkOutDate")
    .notEmpty().withMessage("Check-out date is required")
    .isISO8601().withMessage("Invalid check-out date format"),
  body("guestCount").optional().isInt({ min: 1 }).withMessage("Guest count must be at least 1"),
  body("specialRequests").optional().isLength({ max: 500 }).withMessage("Special requests max 500 chars"),
];

// ─── Create Reservation (User) ────────────────────────────────
export const createReservation = async (req, res, next) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { roomId, checkInDate, checkOutDate, guestCount, specialRequests } = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Invalid room ID format." });
    }

    // Find room with session lock
    const room = await Room.findById(roomId).session(session);
    if (!room) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Room not found." });
    }
    
    if (room.status === "reserved") {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, message: "Room is not available." });
    }

    // Check capacity
    if (guestCount && guestCount > room.capacity) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Room capacity is ${room.capacity} guests.`,
      });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date.",
      });
    }

    // Calculate total price
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * room.price;

    // Check for overlapping reservations with session lock
    const conflict = await Reservation.findOne({
      roomId,
      status: { $nin: ["cancelled"] },
      $or: [
        { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } },
      ],
    }).session(session);

    if (conflict) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: "Room is already booked for the selected dates.",
      });
    }

    // Create reservation within transaction
    const [reservation] = await Reservation.create([{
      userId: req.user._id,
      roomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalPrice,
      guestCount: guestCount || 1,
      specialRequests: specialRequests || "",
    }], { session });

    // Mark room as reserved within transaction
    room.status = "reserved";
    await room.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Populate room details after transaction
    await reservation.populate("roomId", "roomNumber roomType price");

    res.status(201).json({
      success: true,
      message: "Reservation created successfully.",
      data: reservation,
    });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// ─── Get User Reservations ────────────────────────────────────
export const getUserReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ userId: req.user._id })
      .populate("roomId", "roomNumber roomType price images")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

// ─── Cancel Reservation (User) ────────────────────────────────
export const cancelReservation = async (req, res, next) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reservation ID format.",
      });
    }

    const reservation = await Reservation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reservation not found." });
    }
    if (reservation.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Reservation is already cancelled." });
    }
    if (reservation.status === "completed") {
      return res.status(400).json({ success: false, message: "Cannot cancel a completed reservation." });
    }

    // Check cancellation window (before check-in)
    if (new Date() >= reservation.checkInDate) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a reservation after check-in date.",
      });
    }

    reservation.status = "cancelled";
    await reservation.save();

    // Free up the room
    await Room.findByIdAndUpdate(reservation.roomId, { status: "available" });

    res.status(200).json({
      success: true,
      message: "Reservation cancelled successfully.",
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Reservations (Admin) ─────────────────────────────
export const getAllReservations = async (req, res, next) => {
  try {
    // Validate query parameters for injection
    if (!validateQueryParams(req.query, res)) {
      return; // Response already sent
    }

    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Validate status parameter
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be: pending, confirmed, cancelled, or completed.",
        });
      }
      filter.status = status;
    }

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number.",
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid limit. Must be between 1 and 100.",
      });
    }

    const skip = (pageNum - 1) * limitNum;

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .populate("userId", "name email")
        .populate("roomId", "roomNumber roomType price")
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Reservation.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: reservations,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};
