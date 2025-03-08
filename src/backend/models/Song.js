const mongoose = require("mongoose");

const SongSchema = new mongoose.Schema({
  song: String,
  artist: String,
  lyricsUrl: String, // ✅ Store Genius lyrics URL
  timestamp: { type: Date, default: Date.now },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model("Song", SongSchema);
