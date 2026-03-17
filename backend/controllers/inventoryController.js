import { body } from "express-validator";
import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import Room from "../models/Room.js";
import { validateQueryParams } from "../utils/security.js";

// ─── Validation Rules ─────────────────────────────────────────
export const inventoryValidation = [
  body("roomId").notEmpty().withMessage("Room ID is required").isMongoId().withMessage("Invalid room ID"),
  body("itemName").trim().notEmpty().withMessage("Item name is required").isLength({ max: 100 }).withMessage("Item name max 100 characters"),
  body("category").notEmpty().withMessage("Category is required").isIn([
    "Furniture", "Electronics", "Linens", "Bathroom", "Kitchen", "Cleaning", "Maintenance", "Amenities", "Safety", "Other"
  ]).withMessage("Invalid category"),
  body("quantity").isInt({ min: 0 }).withMessage("Quantity must be a non-negative integer"),
  body("minQuantity").optional().isInt({ min: 0 }).withMessage("Min quantity must be a non-negative integer"),
  body("maxQuantity").optional().isInt({ min: 1 }).withMessage("Max quantity must be at least 1"),
  body("unitPrice").isFloat({ min: 0 }).withMessage("Unit price must be a non-negative number"),
  body("supplier.name").optional().trim().isLength({ max: 100 }).withMessage("Supplier name max 100 characters"),
  body("supplier.contact").optional().trim().isLength({ max: 100 }).withMessage("Supplier contact max 100 characters"),
  body("supplier.email").optional().trim().isEmail().withMessage("Invalid supplier email"),
  body("condition").optional().isIn(["New", "Good", "Fair", "Poor", "Damaged", "Needs Replacement"]).withMessage("Invalid condition"),
  body("notes").optional().trim().isLength({ max: 500 }).withMessage("Notes max 500 characters"),
  body("barcode").optional().trim().isLength({ max: 50 }).withMessage("Barcode max 50 characters"),
  body("location").optional().trim().isLength({ max: 100 }).withMessage("Location max 100 characters"),
];

// ─── Get All Inventory Items ──────────────────────────────────
export const getInventoryItems = async (req, res, next) => {
  try {
    // Validate query parameters for injection
    if (!validateQueryParams(req.query, res)) {
      return; // Response already sent
    }

    const { 
      roomId, 
      category, 
      status, 
      condition,
      stockStatus,
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { isActive: true };

    // Apply filters
    if (roomId) {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room ID format.",
        });
      }
      filter.roomId = roomId;
    }

    const validCategories = ["Furniture", "Electronics", "Linens", "Bathroom", "Kitchen", "Cleaning", "Maintenance", "Amenities", "Safety", "Other"];
    if (category && validCategories.includes(category)) {
      filter.category = category;
    }

    const validStatuses = ["In Stock", "Low Stock", "Out of Stock", "On Order", "Discontinued"];
    if (status && validStatuses.includes(status)) {
      filter.status = status;
    }

    const validConditions = ["New", "Good", "Fair", "Poor", "Damaged", "Needs Replacement"];
    if (condition && validConditions.includes(condition)) {
      filter.condition = condition;
    }

    // Handle stock status filter
    if (stockStatus) {
      switch (stockStatus) {
        case 'critical':
          filter.quantity = 0;
          break;
        case 'low':
          filter.$expr = { $lte: ['$quantity', '$minQuantity'] };
          break;
        case 'overstocked':
          filter.$expr = { $gte: ['$quantity', '$maxQuantity'] };
          break;
        case 'normal':
          filter.$expr = { 
            $and: [
              { $gt: ['$quantity', '$minQuantity'] },
              { $lt: ['$quantity', '$maxQuantity'] }
            ]
          };
          break;
      }
    }

    // Validate pagination
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

    // Validate sort parameters
    const validSortFields = ['itemName', 'category', 'quantity', 'unitPrice', 'totalValue', 'status', 'condition', 'createdAt', 'lastRestocked'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Inventory.find(filter)
        .populate('roomId', 'roomNumber roomType')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      Inventory.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Inventory Item by ID ─────────────────────────────────
export const getInventoryItemById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID format.",
      });
    }

    const item = await Inventory.findById(req.params.id)
      .populate('roomId', 'roomNumber roomType');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// ─── Create Inventory Item (Admin) ────────────────────────────
export const createInventoryItem = async (req, res, next) => {
  try {
    // Verify room exists
    const room = await Room.findById(req.body.roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    const item = await Inventory.create(req.body);
    await item.populate('roomId', 'roomNumber roomType');

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully.",
      data: item
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.barcode) {
      return res.status(409).json({
        success: false,
        message: "Barcode already exists.",
      });
    }
    next(error);
  }
};

// ─── Update Inventory Item (Admin) ────────────────────────────
export const updateInventoryItem = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID format.",
      });
    }

    // If roomId is being updated, verify it exists
    if (req.body.roomId) {
      const room = await Room.findById(req.body.roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found.",
        });
      }
    }

    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('roomId', 'roomNumber roomType');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully.",
      data: item
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.barcode) {
      return res.status(409).json({
        success: false,
        message: "Barcode already exists.",
      });
    }
    next(error);
  }
};

// ─── Delete Inventory Item (Admin) ────────────────────────────
export const deleteInventoryItem = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID format.",
      });
    }

    // Soft delete by setting isActive to false
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Stock Quantity (Admin) ────────────────────────────
export const updateStock = async (req, res, next) => {
  try {
    const { quantity, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID format.",
      });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a non-negative number.",
      });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    let newQuantity;
    switch (operation) {
      case 'add':
        newQuantity = item.quantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, item.quantity - quantity);
        break;
      case 'set':
      default:
        newQuantity = quantity;
        break;
    }

    item.quantity = newQuantity;
    if (operation === 'add') {
      item.lastRestocked = new Date();
    }

    await item.save();
    await item.populate('roomId', 'roomNumber roomType');

    res.status(200).json({
      success: true,
      message: "Stock updated successfully.",
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Inventory Analytics (Admin) ──────────────────────────
export const getInventoryAnalytics = async (req, res, next) => {
  try {
    const [
      totalItems,
      totalValue,
      categoryStats,
      statusStats,
      conditionStats,
      lowStockItems,
      maintenanceAlerts
    ] = await Promise.all([
      // Total items count
      Inventory.countDocuments({ isActive: true }),

      // Total inventory value
      Inventory.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalValue: { $sum: '$totalValue' } } }
      ]),

      // Category statistics
      Inventory.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalValue: { $sum: '$totalValue' },
            averageValue: { $avg: '$totalValue' }
          }
        },
        { $sort: { totalValue: -1 } }
      ]),

      // Status statistics
      Inventory.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Condition statistics
      Inventory.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$condition',
            count: { $sum: 1 }
          }
        }
      ]),

      // Low stock items
      Inventory.find({
        isActive: true,
        $expr: { $lte: ['$quantity', '$minQuantity'] }
      })
      .populate('roomId', 'roomNumber roomType')
      .sort({ quantity: 1 })
      .limit(10),

      // Maintenance alerts (items due for maintenance in next 30 days)
      Inventory.find({
        isActive: true,
        nextMaintenanceDate: {
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })
      .populate('roomId', 'roomNumber roomType')
      .sort({ nextMaintenanceDate: 1 })
      .limit(10)
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalItems,
          totalValue: totalValue[0]?.totalValue || 0,
          lowStockCount: lowStockItems.length,
          maintenanceAlertsCount: maintenanceAlerts.length
        },
        categoryStats,
        statusStats,
        conditionStats,
        lowStockItems,
        maintenanceAlerts
      }
    });
  } catch (error) {
    next(error);
  }
};