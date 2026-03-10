import { body } from "express-validator";
import mongoose from "mongoose";
import User from "../models/User.js";
import { validateQueryParams } from "../utils/security.js";

// ─── Validation Rules ─────────────────────────────────────────
export const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),
];

// ─── Get Profile (User) ───────────────────────────────────────
export const getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
};

// ─── Update Profile (User) ────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Users (Admin) ────────────────────────────────────
export const getAllUsers = async (req, res, next) => {
  try {
    // Validate query parameters for injection
    if (!validateQueryParams(req.query, res)) {
      return; // Response already sent
    }

    const { page = 1, limit = 20 } = req.query;

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

    const [users, total] = await Promise.all([
      User.find({})
        .select("-password -otpHash")
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update User Role (Admin) ─────────────────────────────────
export const updateUserRole = async (req, res, next) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format.",
      });
    }

    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password -otpHash");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "User role updated.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
