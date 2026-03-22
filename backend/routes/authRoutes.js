import { Router } from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { generateOTP, hashOTP, verifyOTP, sendOTPEmail } from "../services/otpService.js";

const router = Router();

// ─── REGISTER ─────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    await User.create({ name, email, password });
    res.json({ success: true, message: "Registration successful" });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    console.log('Password matched, generating OTP');

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    
    user.otpHash = otpHash;
    user.otpExpiry = new Date(Date.now() + 300000);
    user.otpAttempts = 0;
    await user.save();

    console.log('OTP saved, sending email');

    // Send OTP
    try {
      await sendOTPEmail(user.email, user.name, otp);
      console.log('OTP sent successfully to:', email);
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      return res.status(500).json({ success: false, message: "Failed to send OTP email" });
    }

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: "Login failed: " + error.message });
  }
});

// ─── VERIFY OTP ───────────────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
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

    user.otpHash = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

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
});

// ─── GET ME ───────────────────────────────────────────────────
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

export default router;
