import { Router } from "express";
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  roomValidation,
} from "../controllers/roomController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import validate from "../middlewares/validate.js";

const router = Router();

// Public routes
router.get("/", getRooms);
router.get("/:id", getRoomById);

// Admin-only routes
router.post("/", authMiddleware, adminMiddleware, roomValidation, validate, createRoom);
router.put("/:id", authMiddleware, adminMiddleware, validate, updateRoom);
router.delete("/:id", authMiddleware, adminMiddleware, deleteRoom);

export default router;
