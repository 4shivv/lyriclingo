const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const Redis = require("ioredis");
const path = require("path");

const spotifyRoutes = require("./routes/spotifyRoutes");
const songRoutes = require("./routes/songRoutes");
const lyricsRoutes = require("./routes/lyricsRoutes"); // ✅ Ensure this is correct
const authRoutes = require("./routes/authRoutes"); // Add this line

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Middleware
app.use(cors());
app.use(express.json());

// Use the REDIS_URL environment variable, or fallback to localhost if not set
const redisURL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const redis = new Redis(redisURL);

// Log Redis connection errors
redis.on("error", (err) => {
  console.error("Redis error:", err);
});

// Add this near your Redis setup if you have Redis
// Make Redis client available globally for use in controllers
if (redis) {
  global.redisClient = redis;
}

// ✅ API Routes - Ensure these match correctly
app.use("/api/spotify", spotifyRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/lyrics", lyricsRoutes);
app.use("/api/auth", authRoutes); // Add this line

// Add a simple health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Serve frontend from current directory (development mode)
// This approach works better when frontend and backend are in the same project
if (process.env.NODE_ENV === 'production') {
  // Production: serve from the frontend/build directory
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
  });
} else {
  // Development: serve from the parent directory
  app.use(express.static(path.join(__dirname, "../")));
  
  // For development, we'll just send a simple message for non-API routes
  app.get("/", (req, res) => {
    res.send("LyricLingo Backend is Running!");
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on ${process.env.BACKEND_URL || `http://localhost:${PORT}`}`);
});
