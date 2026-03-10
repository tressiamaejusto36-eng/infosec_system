import { body } from "express-validator";
import mongoose from "mongoose";
import Room from "../models/Room.js";
import { validateQueryParams } from "../utils/security.js";

// ─── Validation Rules ─────────────────────────────────────────
export const roomValidation = [
  body("roomNumber").trim().notEmpty().withMessage("Room number is required"),
  body("roomType")
    .notEmpty().withMessage("Room type is required")
    .isIn(["Standard", "Deluxe", "Suite", "Presidential"]).withMessage("Invalid room type"),
  body("price")
    .isNumeric().withMessage("Price must be a number")
    .isFloat({ min: 0 }).withMessage("Price cannot be negative"),
  body("capacity")
    .isInt({ min: 1 }).withMessage("Capacity must be at least 1"),
];

// ─── Get All Rooms (Public) ────────────────────────────────────
export const getRooms = async (req, res, next) => {
  try {
    // Validate query parameters for injection
    if (!validateQueryParams(req.query, res)) {
      return; // Response already sent
    }

    const { type, status, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    const filter = {};

    // Validate and sanitize query parameters
    const validRoomTypes = ["Standard", "Deluxe", "Suite", "Presidential"];
    const validStatuses = ["available", "reserved"];

    if (type) {
      // Prevent injection - only allow valid enum values
      if (!validRoomTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room type. Must be: Standard, Deluxe, Suite, or Presidential.",
        });
      }
      filter.roomType = type;
    }

    if (status) {
      // Prevent injection - only allow valid enum values
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be: available or reserved.",
        });
      }
      filter.status = status;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        const min = parseFloat(minPrice);
        if (isNaN(min) || min < 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid minPrice. Must be a positive number.",
          });
        }
        filter.price.$gte = min;
      }
      if (maxPrice) {
        const max = parseFloat(maxPrice);
        if (isNaN(max) || max < 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid maxPrice. Must be a positive number.",
          });
        }
        filter.price.$lte = max;
      }
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
    const [rooms, total] = await Promise.all([
      Room.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
      Room.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: rooms,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Room By ID (Public) ───────────────────────────────────
export const getRoomById = async (req, res, next) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID format.",
      });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found." });
    }
    res.status(200).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// ─── Create Room (Admin) ───────────────────────────────────────
export const createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({
      success: true,
      message: "Room created successfully.",
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Room (Admin) ───────────────────────────────────────
export const updateRoom = async (req, res, next) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID format.",
      });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found." });
    }
    res.status(200).json({
      success: true,
      message: "Room updated successfully.",
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Room (Admin) ───────────────────────────────────────
export const deleteRoom = async (req, res, next) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID format.",
      });
    }

    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found." });
    }
    res.status(200).json({
      success: true,
      message: "Room deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
