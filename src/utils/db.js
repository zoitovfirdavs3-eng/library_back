// src/utils/db.js
const mongoose = require("mongoose");

module.exports = async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is not defined in .env");

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2,  // Minimum number of connections in the pool
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    
    console.log("MongoDB connected ✅");
  } catch (err) {
    console.log("MongoDB error ❌", err.message);
    process.exit(1);
  }
};
