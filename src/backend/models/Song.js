const mongoose = require("mongoose");

const SongSchema = new mongoose.Schema({
  song: String,
  artist: String,
  lyricsUrl: String, // ✅ Store Genius lyrics URL
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Song", SongSchema);
