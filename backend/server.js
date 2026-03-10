import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./db.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import errorHandler from "./middlewares/errorHandler.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(globalLimiter);

// ─── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ─── Data Sanitization ───────────────────────────────────────
// Custom NoSQL injection prevention
app.use((req, res, next) => {
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    for (const key in obj) {
      if (key.includes('$') || key.includes('.')) {
        console.warn(`[Security] Blocked NoSQL injection attempt: ${key} from ${req.ip}`);
        continue; // Skip this key
      }
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  };

  // Sanitize request body (this is mutable)
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // For query params, we'll validate them in controllers instead
  // since req.query is read-only
  
  next();
});

// Basic XSS protection - sanitize HTML entities
app.use((req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
    return obj;
  };

  // Only sanitize request body, not response
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  next();
});

// ─── API Routes ──────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/users", userRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "SecureStay API is running" });
});

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Centralized Error Handler ────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────
try {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✅ SecureStay server running on port ${PORT}`);
  });
} catch (error) {
  console.error("❌ Database connection failed:", error);
  process.exit(1);
}