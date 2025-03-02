const Song = require("../models/Song"); // ✅ Import once
const { getLyricsFromGenius } = require("../services/geniusService");
const { fetchLyricsUrl } = require("../services/lyricsService"); // Import Genius search function
const { translateBatch } = require("../services/translationService"); // ✅ Import batch translation
const axios = require("axios");
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

// Optionally add an error listener to handle connection issues gracefully:
redis.on("error", (error) => {
  console.error("Redis error:", error);
});

// Use BACKEND_URL environment variable if available. Otherwise, we'll use the request's host.
const BACKEND_URL = process.env.BACKEND_URL;

// ✅ Log a new song (triggered by user action) and fetch the lyrics URL
const logSong = async (req, res) => {
  try {
    const { song, artist } = req.body;

    if (!song || !artist) {
      return res.status(400).json({ error: "Song and artist are required" });
    }

    console.log(`🎵 Logging song: ${song} by ${artist}`);

    // ✅ Check if song already exists in DB
    let existingSong = await Song.findOne({ song, artist });
    if (existingSong) {
      console.log("✅ Song already exists in history.");
      return res.json({ message: "Song already exists!", song: existingSong });
    }

    // ✅ Fetch Genius Lyrics URL
    console.log(`🔍 Searching for Genius lyrics URL for: ${song} by ${artist}`);
    const lyricsUrl = await fetchLyricsUrl(song, artist);

    if (!lyricsUrl) {
      return res.status(404).json({ error: "Lyrics URL not found." });
    }

    console.log(`✅ Found lyrics URL: ${lyricsUrl}`);

    // ✅ Store song in MongoDB
    const newSong = new Song({ song, artist, lyricsUrl });
    await newSong.save();

    // ✅ Delete Cache for This Song
    await redis.del(`flashcards:${song}`);
    console.log(`🗑️ Cleared cache for: ${song}`);

    res.json({ message: "Song logged successfully!", song: newSong });
  } catch (error) {
    console.error("❌ Error logging song:", error);
    res.status(500).json({ error: "Failed to log song." });
  }
};

// ✅ Get song history
const getSongHistory = async (req, res) => {
  try {
    const songs = await Song.find().sort({ timestamp: -1 });
    res.json(songs);
  } catch (error) {
    console.error("❌ Error fetching song history:", error);
    res.status(500).json({ error: "Failed to fetch history." });
  }
};

// ✅ Clear song history
const clearHistory = async (req, res) => {
  try {
    await Song.deleteMany({}); // 🗑️ Delete song history from MongoDB
    await redis.flushdb(); // 🔥 Clear ALL Redis cache (optional: limit scope)
    
    console.log("✅ History and Redis cache cleared on logout");

    res.json({ message: "History and cache cleared!" });
  } catch (error) {
    console.error("❌ Error clearing history:", error);
    res.status(500).json({ error: "Failed to clear history." });
  }
};


const getFlashcardsForSong = async (req, res) => {
  try {
    const songTitle = req.query.song;
    const sourceLanguage = req.query.lang || "es";
    const cacheKey = `flashcards:${songTitle}`;

    // Check Redis cache first
    const cachedFlashcards = await redis.get(cacheKey);
    if (cachedFlashcards) {
      console.log(`⚡ Serving flashcards from cache for: ${songTitle}`);
      return res.json(JSON.parse(cachedFlashcards));
    }

    console.log(`🔎 Looking for song: ${songTitle}`);

    // Find song in the DB
    const song = await Song.findOne({ song: songTitle });
    if (!song || !song.lyricsUrl) {
      return res.status(404).json({ error: "Song not found in history" });
    }
    console.log(`✅ Found song in DB with lyrics URL: ${song.lyricsUrl}`);

    // Normalize BACKEND_URL to ensure it includes a protocol
    const normalizedBackendUrl = BACKEND_URL
      ? (BACKEND_URL.startsWith("http") ? BACKEND_URL : `https://${BACKEND_URL}`)
      : `${req.protocol}://${req.get('host')}`;

    // Fetch Lyrics from the Lyrics API
    const response = await fetch(
      `${normalizedBackendUrl}/api/lyrics/fetch-lyrics?lyricsUrl=${encodeURIComponent(song.lyricsUrl)}`
    );
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `Failed to fetch lyrics. Status: ${response.status}, Message: ${errorData}`
      );
      return res.status(500).json({ 
         error: "Failed to fetch lyrics from Genius", 
         details: errorData 
      });
    }
    
    const data = await response.json();

    if (!data.lyrics || data.lyrics.trim().length === 0) {
      return res.status(500).json({ error: "Failed to fetch lyrics from Genius" });
    }
    
    console.log("🔍 Raw Lyrics Received");

    // Split lyrics by line breaks to preserve original structure
    const lyricsLines = data.lyrics.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0); // Remove empty lines
    
    console.log(`📝 Found ${lyricsLines.length} lyric lines`);

    // Prepare arrays for translation
    let frontLines = lyricsLines;
    
    // More efficient approach: translate each line individually in batches
    // This avoids delimiter issues entirely
    let backLines = [];
    const BATCH_SIZE = 10; // Number of lines to translate in each API call
    
    // Process lyrics in batches of lines
    for (let i = 0; i < frontLines.length; i += BATCH_SIZE) {
      const batch = frontLines.slice(i, i + BATCH_SIZE);
      console.log(`🔤 Translating batch ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} lines)`);
      
      // Send each line as a separate element in the array
      // This is more efficient than individual API calls while avoiding delimiter issues
      const translatedBatch = await translateBatch(batch, sourceLanguage);
      
      // Add translated lines to results (no need to split or handle delimiters)
      backLines = [...backLines, ...translatedBatch];
    }
    
    // Ensure arrays are the same length
    while (backLines.length < frontLines.length) {
      backLines.push("Translation unavailable");
    }
    while (backLines.length > frontLines.length) {
      backLines.pop();
    }

    // Create flashcards with proper alignment and cleanup any potential remaining delimiters
    let flashcards = frontLines.map((line, index) => {
      // Safety check to ensure we have a translation for this index
      const translation = index < backLines.length ? backLines[index] : "Translation unavailable";
      
      return {
        front: line.trim(),
        // Extra cleaning to remove any potential artifact characters from translation
        back: translation.trim().replace(/\|+/g, '').trim()
      };
    });
    
    // Filter out cards with empty fronts or backs or where front/back are identical
    flashcards = flashcards.filter(card => 
      card.front.length > 0 && 
      card.back.length > 0 &&
      card.front !== card.back
    );

    console.log(`✅ Created ${flashcards.length} flashcards`);
    
    // Cache the flashcards
    await redis.setex(cacheKey, 86400, JSON.stringify(flashcards));

    res.json(flashcards);
  } catch (error) {
    console.error("❌ Error fetching flashcards:", error);
    res.status(500).json({ error: "Failed to generate flashcards." });
  }
};

const deleteSong = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSong = await Song.findByIdAndDelete(id);
    if (!deletedSong) {
      return res.status(404).json({ error: "Song not found" });
    }
    res.json({ message: "Song deleted successfully!" });
  } catch (error) {
    console.error("Error deleting song:", error);
    res.status(500).json({ error: "Failed to delete song." });
  }
};

// ✅ Ensure all functions are correctly exported
module.exports = { logSong, getSongHistory, clearHistory, getFlashcardsForSong, deleteSong };