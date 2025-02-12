const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const Redis = require("ioredis");
const redis = new Redis(); // Default Redis connection (localhost:6379)
const path = require("path");

const spotifyRoutes = require("./routes/spotifyRoutes");
const songRoutes = require("./routes/songRoutes");
const lyricsRoutes = require("./routes/lyricsRoutes"); // ✅ Ensure this is correct

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Middleware
app.use(cors());
app.use(express.json());

// ✅ API Routes - Ensure these match correctly
app.use("/api/spotify", spotifyRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/lyrics", lyricsRoutes); 

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "frontend/build")));

// The "catchall" handler: for any request that doesn't
// match one above, send back the React app.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/frontend/build/index.html"));
});

app.get("/", (req, res) => {
  res.send("LyricLingo Backend is Running!");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
