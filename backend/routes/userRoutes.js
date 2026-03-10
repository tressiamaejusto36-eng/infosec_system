import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserRole,
  updateProfileValidation,
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import validate from "../middlewares/validate.js";

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// User routes
router.get("/profile", getProfile);
router.put("/profile", updateProfileValidation, validate, updateProfile);

// Admin routes
router.get("/", adminMiddleware, getAllUsers);
router.patch("/:id/role", adminMiddleware, updateUserRole);

export default router;
