import jwt from "jsonwebtoken";
import { body } from "express-validator";
import User from "../models/User.js";
import { generateOTP, hashOTP, verifyOTP, sendOTPEmail } from "../services/otpService.js";

// ─── Validation Rules ─────────────────────────────────────────
export const loginValidation = [
  body("email").trim().isEmail().withMessage("Invalid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password required"),
];

// ─── Login ────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    
    user.otpHash = otpHash;
    user.otpExpiry = new Date(Date.now() + 300000); // 5 minutes
    user.otpAttempts = 0;
    await user.save();

    // Send OTP
    await sendOTPEmail(user.email, user.name, otp);

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

// ─── Verify OTP ───────────────────────────────────────────────
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select("+otpHash");
    if (!user || !user.otpHash) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const isValid = await verifyOTP(otp, user.otpHash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Clear OTP
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

// ─── Register ─────────────────────────────────────────────────
export const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name required"),
  body("email").trim().isEmail().withMessage("Invalid email").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be 8+ characters"),
];

export const register = async (req, res) => {
  try {
    const { name, email, password, recaptchaToken } = req.body;

    if (!recaptchaToken) {
      return res.status(400).json({ success: false, message: "reCAPTCHA required" });
    }

    // Verify reCAPTCHA
    const recaptchaResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
      }
    );
    const recaptchaData = await recaptchaResponse.json();

    if (!recaptchaData.success) {
      return res.status(400).json({ success: false, message: "reCAPTCHA failed" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({ success: true, message: "Registration successful" });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

// ─── Get Me ───────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get user" });
  }
};

export const otpValidation = [
  body("email").trim().isEmail().withMessage("Invalid email").normalizeEmail(),
  body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
];
