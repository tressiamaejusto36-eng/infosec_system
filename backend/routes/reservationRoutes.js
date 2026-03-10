import { Router } from "express";
import {
  createReservation,
  getUserReservations,
  cancelReservation,
  getAllReservations,
  reservationValidation,
} from "../controllers/reservationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import validate from "../middlewares/validate.js";

const router = Router();

// All reservation routes require authentication
router.use(authMiddleware);

// User routes
router.post("/", reservationValidation, validate, createReservation);
router.get("/my", getUserReservations);
router.patch("/:id/cancel", cancelReservation);

// Admin routes
router.get("/", adminMiddleware, getAllReservations);

export default router;
