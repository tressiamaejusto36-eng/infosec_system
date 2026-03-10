import jwt from "jsonwebtoken";
import { body } from "express-validator";
import User from "../models/User.js";
import { generateOTP, hashOTP, verifyOTP, sendOTPEmail } from "../services/otpService.js";

// ─── Validation Rules ─────────────────────────────────────────
export const registerValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password must contain at least one special character"),
];

export const loginValidation = [
  body("email").trim().isEmail().withMessage("Invalid email format").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

export const otpValidation = [
  body("email").trim().isEmail().withMessage("Invalid email").normalizeEmail(),
  body("otp")
    .notEmpty().withMessage("OTP is required")
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be exactly 6 digits")
    .isNumeric().withMessage("OTP must contain only digits"),
];

// ─── Register ─────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password, recaptchaToken } = req.body;

    // Verify reCAPTCHA
    if (!recaptchaToken) {
      return res.status(400).json({
        success: false,
        message: "Please complete the reCAPTCHA verification.",
      });
    }

    // Verify reCAPTCHA with Google
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    const recaptchaResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${recaptchaSecret}&response=${recaptchaToken}`,
      }
    );

    const recaptchaData = await recaptchaResponse.json();

    if (!recaptchaData.success) {
      // Log error codes for debugging (sanitized)
      if (process.env.NODE_ENV === "development") {
        console.error("reCAPTCHA failed with codes:", recaptchaData["error-codes"]);
      }
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA verification failed. Please try again.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: "Account created successfully. Please login.",
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

// ─── Login ────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user with password and OTP fields
    const user = await User.findOne({ email }).select("+password +otpHash");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const remainingMs = user.lockUntil - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${remainingMin} minute(s).`,
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementFailedAttempts();
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
      const attemptsLeft = maxAttempts - user.failedLoginAttempts;
      return res.status(401).json({
        success: false,
        message:
          attemptsLeft > 0
            ? `Invalid email or password. ${attemptsLeft} attempt(s) remaining.`
            : "Account locked due to too many failed attempts. Try again in 5 minutes.",
      });
    }

    // Password correct – reset failed attempts
    await user.resetFailedAttempts();

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const otpExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY) || 300000));

    // Save OTP hash and reset attempts
    user.otpHash = otpHash;
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0;
    await user.save();

    // Send OTP email
    await sendOTPEmail(user.email, user.name, otp);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email. Please verify to complete login.",
      data: { email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify OTP ───────────────────────────────────────────────
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select("+otpHash");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check account lock
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: "Account is temporarily locked. Please try again later.",
      });
    }

    // Check OTP exists
    if (!user.otpHash || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found. Please login again.",
      });
    }

    // Check OTP expiry
    if (new Date() > user.otpExpiry) {
      user.otpHash = null;
      user.otpExpiry = null;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please login again.",
      });
    }

    // Check max OTP attempts
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
    if (user.otpAttempts >= maxAttempts) {
      const lockTime = parseInt(process.env.LOCK_TIME) || 300000;
      user.lockUntil = new Date(Date.now() + lockTime);
      user.otpHash = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(423).json({
        success: false,
        message: "Too many OTP attempts. Account locked for 5 minutes.",
      });
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, user.otpHash);
    if (!isValid) {
      user.otpAttempts += 1;
      await user.save();
      const attemptsLeft = maxAttempts - user.otpAttempts;
      return res.status(401).json({
        success: false,
        message: `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`,
      });
    }

    // OTP valid – clear OTP fields
    user.otpHash = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Issue JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "1h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Current User ─────────────────────────────────────────
export const getMe = async (req, res) => {
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
