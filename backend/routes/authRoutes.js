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

router.post("/register", registerLimiter, registerValidation, validate, register);
router.post("/login", loginLimiter, loginValidation, validate, login);
router.post("/verify-otp", otpLimiter, otpValidation, validate, verifyOtp);
router.get("/me", authMiddleware, getMe);

export default router;
