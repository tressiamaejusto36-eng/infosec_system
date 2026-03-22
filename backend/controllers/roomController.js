import { body } from "express-validator";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import Room from "../models/Room.js";
import { validateQueryParams } from "../utils/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Set basePrice to price if not provided
    if (!req.body.basePrice && req.body.price) {
      req.body.basePrice = req.body.price;
    }
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

    // Set basePrice to price if not provided and price is being updated
    if (!req.body.basePrice && req.body.price) {
      req.body.basePrice = req.body.price;
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

    // Delete associated images
    if (room.images && room.images.length > 0) {
      room.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Room deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── Upload Room Images (Admin) ────────────────────────────────
export const uploadRoomImages = async (req, res, next) => {
  try {
    console.log('🖼️ Image upload request received for room:', req.params.id);
    console.log('📁 Files received:', req.files?.length || 0);
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('❌ Invalid room ID format:', req.params.id);
      return res.status(400).json({
        success: false,
        message: "Invalid room ID format.",
      });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      console.log('❌ Room not found:', req.params.id);
      return res.status(404).json({ success: false, message: "Room not found." });
    }

    console.log('✅ Room found:', room.roomNumber, 'Current images:', room.images?.length || 0);

    if (!req.files || req.files.length === 0) {
      console.log('❌ No files in request');
      return res.status(400).json({
        success: false,
        message: "No images uploaded.",
      });
    }

    // Generate image URLs
    const imageUrls = req.files.map(file => {
      const url = `/uploads/rooms/${file.filename}`;
      console.log('📄 Generated URL:', url, 'for file:', file.filename);
      return url;
    });
    
    // Add new images to existing ones (max 5 total)
    const updatedImages = [...(room.images || []), ...imageUrls].slice(0, 5);
    console.log('📋 Updated images array:', updatedImages);
    
    room.images = updatedImages;
    await room.save();
    console.log('✅ Room saved with images');

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully.",
      data: {
        images: updatedImages,
        uploadedCount: req.files.length
      }
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        const filePath = file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    next(error);
  }
};

// ─── Delete Room Image (Admin) ─────────────────────────────────
export const deleteRoomImage = async (req, res, next) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID format.",
      });
    }

    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required.",
      });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found." });
    }

    // Remove image from array
    const imageIndex = room.images.indexOf(imageUrl);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found in room.",
      });
    }

    room.images.splice(imageIndex, 1);
    await room.save();

    // Delete physical file
    const imagePath = path.join(__dirname, '..', imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.status(200).json({
      success: true,
      message: "Image deleted successfully.",
      data: { images: room.images }
    });
  } catch (error) {
    next(error);
  }
};


// ─── Advanced Room Search (Public) ─────────────────────────────
export const advancedRoomSearch = async (req, res, next) => {
  try {
    const {
      roomType,
      minPrice,
      maxPrice,
      minCapacity,
      maxCapacity,
      amenities,
      checkInDate,
      checkOutDate,
      housekeepingStatus,
      page = 1,
      limit = 12,
      sortBy = "price",
      sortOrder = "asc",
    } = req.query;

    const filter = {};

    // Room type filter
    const validRoomTypes = ["Standard", "Deluxe", "Suite", "Presidential"];
    if (roomType) {
      const types = roomType.split(",").filter(t => validRoomTypes.includes(t));
      if (types.length > 0) {
        filter.roomType = { $in: types };
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        const min = parseFloat(minPrice);
        if (!isNaN(min) && min >= 0) filter.price.$gte = min;
      }
      if (maxPrice) {
        const max = parseFloat(maxPrice);
        if (!isNaN(max) && max >= 0) filter.price.$lte = max;
      }
    }

    // Capacity filter
    if (minCapacity || maxCapacity) {
      filter.capacity = {};
      if (minCapacity) {
        const min = parseInt(minCapacity);
        if (!isNaN(min) && min > 0) filter.capacity.$gte = min;
      }
      if (maxCapacity) {
        const max = parseInt(maxCapacity);
        if (!isNaN(max) && max > 0) filter.capacity.$lte = max;
      }
    }

    // Amenities filter
    if (amenities) {
      const amenityList = amenities.split(",").map(a => a.trim());
      filter.amenities = { $all: amenityList };
    }

    // Housekeeping status filter (admin only)
    if (housekeepingStatus && req.user?.role === "admin") {
      const validStatuses = ["clean", "dirty", "in-progress", "inspected"];
      if (validStatuses.includes(housekeepingStatus)) {
        filter.housekeepingStatus = housekeepingStatus;
      }
    }

    // Date availability filter
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);

      if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime()) && checkOut > checkIn) {
        // Find rooms that don't have conflicting reservations
        const Reservation = (await import("../models/Reservation.js")).default;
        const conflictingReservations = await Reservation.find({
          status: { $nin: ["cancelled", "checked-out"] },
          $or: [
            { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } },
          ],
        }).distinct("roomId");

        filter._id = { $nin: conflictingReservations };
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const validSortFields = ["price", "capacity", "roomNumber", "roomType", "createdAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "price";
    const sortDirection = sortOrder === "desc" ? -1 : 1;

    const [rooms, total] = await Promise.all([
      Room.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      Room.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: rooms,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
      filters: {
        roomType,
        priceRange: { min: minPrice, max: maxPrice },
        capacityRange: { min: minCapacity, max: maxCapacity },
        amenities: amenities?.split(","),
        dateRange: { checkIn: checkInDate, checkOut: checkOutDate },
      },
    });
  } catch (error) {
    next(error);
  }
};
