const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const { globalError } = require("shokhijakhon-error-handler");
const connectDB = require("./utils/db");
const router = require("./router");
const { initializeMailer, verifySmtp } = require("./utils/mailer");

const app = express();

// Request logger middleware (MUST be first)
app.use((req, res, next) => {
  console.log("➡️ BACKEND HIT:", req.method, req.url);
  next();
});

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      "https://library-front-3lo2.onrender.com",
      "https://your-production-domain.com", // Replace with your actual domain
      "https://www.your-production-domain.com" // Replace with www version
    ]
  : [
      "http://localhost:3000", 
      "http://localhost:3001", 
      "https://library-front-3lo2.onrender.com",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001"
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use("/api", router);

// Root route with API information
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Kutubxona API",
    status: "OK",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login", 
        me: "GET /api/auth/me"
      },
      books: {
        all: "GET /api/books",
        one: "GET /api/books/:id",
        create: "POST /api/books",
        update: "PATCH /api/books/:id",
        delete: "DELETE /api/books/:id",
        upload_cover: "POST /api/books/:id/cover"
      },
      authors: {
        all: "GET /api/authors",
        one: "GET /api/authors/:id",
        create: "POST /api/authors",
        update: "PATCH /api/authors/:id",
        delete: "DELETE /api/authors/:id"
      },
      categories: {
        all: "GET /api/categories",
        one: "GET /api/categories/:id",
        create: "POST /api/categories",
        update: "PATCH /api/categories/:id",
        delete: "DELETE /api/categories/:id"
      }
    },
    documentation: "README.md"
  });
});

// Health check endpoint for Render.com
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    message: "API is running and ready for frontend integration"
  });
});

app.use((req, res) => {
  return res.status(404).json({ message: "Route not found", status: 404 });
});

app.use((err, req, res, next) => {
  // Log error for debugging in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Production Error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  return globalError(err, res);
});

const PORT = process.env.PORT || 10000;

// Export app for testing
module.exports = app;
(async () => {
  try {
    // Log environment variables (without values for security)
    console.log("🔧 SMTP ENV CHECK:", {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      MAIL_FROM: !!process.env.MAIL_FROM,
      SMTP_FROM: !!process.env.SMTP_FROM,
      NODE_ENV: process.env.NODE_ENV
    });
    
    // Initialize mailer first
    initializeMailer();
    
    // Verify SMTP connection with detailed logging
    console.log("🔧 Starting SMTP verification...");
    const smtpVerified = await verifySmtp();
    
    if (!smtpVerified) {
      console.log("⚠️  SMTP verification failed, but continuing server startup...");
    }
    
    await connectDB();
    
    // Seed super_admin if no super_admin exists
    const UserModel = require("./models/User.model");
    const bcrypt = require("bcrypt");
    
    const superAdminExists = await UserModel.findOne({ role: "super_admin" });
    if (!superAdminExists && process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD) {
      const hash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 10);
      
      await UserModel.create({
        first_name: "Super",
        last_name: "Admin",
        email: process.env.SUPER_ADMIN_EMAIL.toLowerCase().trim(),
        password: hash,
        role: "super_admin",
      });
      
      console.log("🔑 Super admin created:", process.env.SUPER_ADMIN_EMAIL);
    }
    
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
})();
