import { Router } from "express";
import {
  createReservation,
  getUserReservations,
  cancelReservation,
  getAllReservations,
  checkInGuest,
  checkOutGuest,
  getCheckInOutDashboard,
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
router.post("/validate-test", reservationValidation, validate, (req, res) => {
  res.json({ success: true, message: "Validation passed", data: req.body });
});
router.get("/my", getUserReservations);
router.patch("/:id/cancel", cancelReservation);

// Admin routes
router.get("/", adminMiddleware, getAllReservations);
router.get("/dashboard", adminMiddleware, getCheckInOutDashboard);
router.patch("/:id/check-in", adminMiddleware, checkInGuest);
router.patch("/:id/check-out", adminMiddleware, checkOutGuest);

export default router;
