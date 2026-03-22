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
    .custom((val) => {
      const checkInDate = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (checkInDate < today) {
        throw new Error("Check-in date cannot be in the past");
      }
      return true;
    }),
  body("checkOutDate")
    .notEmpty().withMessage("Check-out date is required")
    .isISO8601().withMessage("Invalid check-out date format")
    .custom((checkOutDate, { req }) => {
      const checkIn = new Date(req.body.checkInDate);
      const checkOut = new Date(checkOutDate);
      
      if (checkOut <= checkIn) {
        throw new Error("Check-out date must be after check-in date");
      }
      return true;
    }),
  body("guestCount").optional().isInt({ min: 1 }).withMessage("Guest count must be at least 1"),
  body("specialRequests").optional().isLength({ max: 500 }).withMessage("Special requests max 500 chars"),
];

// ─── Create Reservation (User) ────────────────────────────────
export const createReservation = async (req, res, next) => {
  try {
    console.log('🎯 Reservation request received:', req.body);
    console.log('👤 User:', req.user?._id);
    
    const { roomId, checkInDate, checkOutDate, guestCount, specialRequests } = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      console.log('❌ Invalid room ID format:', roomId);
      return res.status(400).json({ success: false, message: "Invalid room ID format." });
    }

    console.log('🏨 Looking for room:', roomId);
    
    // Find and lock the room using findOneAndUpdate with atomic operation
    const room = await Room.findOneAndUpdate(
      { _id: roomId, status: "available" },
      { $set: { status: "reserved" } },
      { returnDocument: 'before' } // Return original document
    );

    if (!room) {
      console.log('❌ Room not available or not found');
      return res.status(409).json({ 
        success: false, 
        message: "Room is not available or does not exist." 
      });
    }

    console.log('✅ Room found and locked:', room.roomNumber);

    try {
      // Check capacity
      if (guestCount && guestCount > room.capacity) {
        console.log('❌ Guest count exceeds capacity:', guestCount, '>', room.capacity);
        // Rollback room status
        await Room.findByIdAndUpdate(roomId, { status: "available" });
        return res.status(400).json({
          success: false,
          message: `Room capacity is ${room.capacity} guests.`,
        });
      }

      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);

      console.log('📅 Dates:', { checkIn, checkOut });

      if (checkOut <= checkIn) {
        console.log('❌ Invalid date range');
        // Rollback room status
        await Room.findByIdAndUpdate(roomId, { status: "available" });
        return res.status(400).json({
          success: false,
          message: "Check-out date must be after check-in date.",
        });
      }

      // Calculate total price
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * room.price;

      console.log('💰 Pricing:', { nights, roomPrice: room.price, totalPrice });

      // Check for overlapping reservations
      const conflict = await Reservation.findOne({
        roomId,
        status: { $nin: ["cancelled"] },
        $or: [
          { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } },
        ],
      });

      if (conflict) {
        console.log('❌ Date conflict found:', conflict._id);
        // Rollback room status
        await Room.findByIdAndUpdate(roomId, { status: "available" });
        return res.status(409).json({
          success: false,
          message: "Room is already booked for the selected dates.",
        });
      }

      console.log('✅ No conflicts found, creating reservation...');

      // Create reservation
      const reservation = await Reservation.create({
        userId: req.user._id,
        roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalPrice,
        guestCount: guestCount || 1,
        specialRequests: specialRequests || "",
      });

      console.log('✅ Reservation created:', reservation._id);

      // Populate room details
      await reservation.populate("roomId", "roomNumber roomType price");

      res.status(201).json({
        success: true,
        message: "Reservation created successfully.",
        data: reservation,
      });
    } catch (innerError) {
      console.error('❌ Inner error during reservation:', innerError);
      // Rollback room status on any error
      try {
        await Room.findByIdAndUpdate(roomId, { status: "available" });
      } catch (rollbackError) {
        console.error("Failed to rollback room status:", rollbackError);
      }
      throw innerError;
    }
  } catch (error) {
    console.error("❌ Reservation creation error:", error);
    if (next && typeof next === 'function') {
      next(error);
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again.",
      });
    }
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

// ─── Check-in Guest (Admin) ───────────────────────────────────
export const checkInGuest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reservation ID",
      });
    }

    const reservation = await Reservation.findById(id)
      .populate("userId", "name email")
      .populate("roomId", "roomNumber roomType");

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    if (reservation.status === "checked-in") {
      return res.status(400).json({
        success: false,
        message: "Guest is already checked in",
      });
    }

    if (reservation.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot check in a cancelled reservation",
      });
    }

    // Update reservation
    reservation.status = "checked-in";
    reservation.checkInTime = new Date();
    reservation.actualCheckInDate = new Date();
    await reservation.save();

    // Update room status
    await Room.findByIdAndUpdate(reservation.roomId, {
      status: "reserved",
      housekeepingStatus: "dirty",
    });

    res.status(200).json({
      success: true,
      message: "Guest checked in successfully",
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Check-out Guest (Admin) ──────────────────────────────────
export const checkOutGuest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reservation ID",
      });
    }

    const reservation = await Reservation.findById(id)
      .populate("userId", "name email")
      .populate("roomId", "roomNumber roomType");

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    if (reservation.status === "checked-out") {
      return res.status(400).json({
        success: false,
        message: "Guest is already checked out",
      });
    }

    if (reservation.status !== "checked-in") {
      return res.status(400).json({
        success: false,
        message: "Guest must be checked in before checking out",
      });
    }

    // Update reservation
    reservation.status = "checked-out";
    reservation.checkOutTime = new Date();
    reservation.actualCheckOutDate = new Date();
    await reservation.save();

    // Update room status and create housekeeping task
    await Room.findByIdAndUpdate(reservation.roomId, {
      status: "cleaning",
      housekeepingStatus: "dirty",
    });

    // Auto-create housekeeping task
    const Housekeeping = (await import("../models/Housekeeping.js")).default;
    await Housekeeping.create({
      roomId: reservation.roomId,
      taskType: "checkout-cleaning",
      priority: "high",
      notes: `Checkout cleaning for reservation ${reservation._id}`,
    });

    res.status(200).json({
      success: true,
      message: "Guest checked out successfully",
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Check-in/Check-out Dashboard (Admin) ─────────────────
export const getCheckInOutDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [checkingInToday, checkingOutToday, currentGuests] = await Promise.all([
      Reservation.find({
        checkInDate: { $gte: today, $lt: tomorrow },
        status: { $in: ["confirmed", "pending"] },
      })
        .populate("userId", "name email phone")
        .populate("roomId", "roomNumber roomType"),

      Reservation.find({
        checkOutDate: { $gte: today, $lt: tomorrow },
        status: "checked-in",
      })
        .populate("userId", "name email phone")
        .populate("roomId", "roomNumber roomType"),

      Reservation.find({
        status: "checked-in",
      })
        .populate("userId", "name email phone")
        .populate("roomId", "roomNumber roomType"),
    ]);

    res.status(200).json({
      success: true,
      data: {
        checkingInToday,
        checkingOutToday,
        currentGuests,
        stats: {
          checkInsToday: checkingInToday.length,
          checkOutsToday: checkingOutToday.length,
          currentOccupancy: currentGuests.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
