import { Router } from "express";
import {
  register,
  login,
  verifyOtp,
  getMe,
  registerValidation,
  loginValidation,
  otpValidation,
} from "../controllers/authController.js";
import { loginLimiter, otpLimiter, registerLimiter } from "../middlewares/rateLimiter.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";

const router = Router();

// POST /api/auth/register
router.post("/register", registerLimiter, registerValidation, validate, register);

// POST /api/auth/login
router.post("/login", loginLimiter, loginValidation, validate, login);

// POST /api/auth/verify-otp
router.post("/verify-otp", otpLimiter, otpValidation, validate, verifyOtp);

// GET /api/auth/me – protected
router.get("/me", authMiddleware, getMe);

export default router;
