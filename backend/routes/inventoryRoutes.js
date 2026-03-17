import { Router } from "express";
import {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  updateStock,
  getInventoryAnalytics,
  inventoryValidation,
} from "../controllers/inventoryController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import validate from "../middlewares/validate.js";

const router = Router();

// All inventory routes require admin authentication
router.use(authMiddleware, adminMiddleware);

// Inventory CRUD routes
router.get("/", getInventoryItems);
router.get("/analytics", getInventoryAnalytics);
router.get("/:id", getInventoryItemById);
router.post("/", inventoryValidation, validate, createInventoryItem);
router.put("/:id", inventoryValidation, validate, updateInventoryItem);
router.delete("/:id", deleteInventoryItem);

// Stock management
router.patch("/:id/stock", updateStock);

export default router;