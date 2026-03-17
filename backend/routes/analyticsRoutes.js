import { Router } from "express";
import {
  getDashboardAnalytics,
  getRevenueAnalytics,
  getOccupancyAnalytics,
  getCustomerAnalytics,
} from "../controllers/analyticsController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = Router();

// All analytics routes require admin authentication
router.use(authMiddleware, adminMiddleware);

// Analytics routes
router.get("/dashboard", getDashboardAnalytics);
router.get("/revenue", getRevenueAnalytics);
router.get("/occupancy", getOccupancyAnalytics);
router.get("/customers", getCustomerAnalytics);

export default router;