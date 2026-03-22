import { Router } from "express";
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  uploadRoomImages,
  deleteRoomImage,
  advancedRoomSearch,
  roomValidation,
} from "../controllers/roomController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import validate from "../middlewares/validate.js";
import { uploadMultiple, handleUploadError } from "../middlewares/upload.js";

const router = Router();

// Public routes
router.get("/", getRooms);
router.get("/search", advancedRoomSearch);
router.get("/:id", getRoomById);

// Admin-only routes
router.post("/", authMiddleware, adminMiddleware, roomValidation, validate, createRoom);
router.put("/:id", authMiddleware, adminMiddleware, validate, updateRoom);
router.delete("/:id", authMiddleware, adminMiddleware, deleteRoom);

// Image upload routes (Admin only)
router.post("/:id/images", authMiddleware, adminMiddleware, uploadMultiple, handleUploadError, uploadRoomImages);
router.delete("/:id/images", authMiddleware, adminMiddleware, deleteRoomImage);

export default router;
