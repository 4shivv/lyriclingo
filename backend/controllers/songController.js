const Song = require("../models/Song"); // ✅ Import once
const { getLyricsFromGenius } = require("../services/geniusService");
const { fetchLyricsUrl } = require("../services/lyricsService"); // Import Genius search function
const { translateBatch } = require("../services/translationService"); // ✅ Import batch translation
const axios = require("axios");
const Redis = require("ioredis");
const redis = new Redis(); // Initialize Redis


// ✅ Log a new song and automatically fetch the lyrics URL
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
    const sourceLanguage = req.query.lang || "es"; // Default to Spanish input
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

    // Fetch Lyrics from the Lyrics API
    const response = await fetch(
      `http://localhost:5001/api/lyrics/fetch-lyrics?lyricsUrl=${encodeURIComponent(song.lyricsUrl)}`
    );
    const data = await response.json();

    if (!data.lyrics || data.lyrics.trim().length === 0) {
      return res.status(500).json({ error: "Failed to fetch lyrics from Genius" });
    }
    console.log("🔍 Raw Lyrics Received:", data.lyrics);

    // 1️⃣ Clean the lyrics
    let cleanedLyrics = data.lyrics
      .replace(/\[.*?\]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // 2️⃣ Translate the full lyrics as a single block
    let translatedResult = await translateBatch([cleanedLyrics], sourceLanguage);
    let translatedLyrics = translatedResult[0] || "Translation unavailable";

    // 3️⃣ Split both original and translated texts using your regex.
    const splitRegex = /(?<=\w[.!?])\s+|(?<!\s)(?=[A-Z])/g;
    let frontLines = cleanedLyrics.split(splitRegex).filter(line => line.trim().length > 0);
    let backLines = translatedLyrics.split(splitRegex).filter(line => line.trim().length > 0);

    // Helper: Merge isolated punctuation segments throughout the array.
    const mergeIsolatedSegments = (lines, isolatedChars) => {
      const merged = [];
      let i = 0;
      while (i < lines.length) {
        let current = lines[i].trim();
        if (isolatedChars.includes(current) && i + 1 < lines.length) {
          let next = lines[i + 1].trim();
          merged.push(current + next);
          i += 2;
        } else {
          merged.push(current);
          i++;
        }
      }
      return merged;
    };

    const isolatedPunctuations = ["(", "¿", "¡"];
    frontLines = mergeIsolatedSegments(frontLines, isolatedPunctuations);
    backLines = mergeIsolatedSegments(backLines, isolatedPunctuations);

    console.log(`🔹 After merging, Original Lyrics segments: ${frontLines.length}`);
    console.log(`🔹 After merging, Translated Lyrics segments: ${backLines.length}`);

    // 4️⃣ Equalize segment counts if needed.
    while (backLines.length < frontLines.length) {
      backLines.push("Translation unavailable");
    }
    while (backLines.length > frontLines.length) {
      backLines.pop();
    }

    // 5️⃣ Generate flashcards.
    let flashcards = frontLines.map((line, index) => ({
      front: line,
      back: (backLines[index] || "Translation unavailable"),
    }));

    console.log(`✅ Generated ${flashcards.length} flashcards for: ${songTitle}`);

    // 6️⃣ Cache the flashcards in Redis for 24 hours.
    await redis.setex(cacheKey, 86400, JSON.stringify(flashcards));

    res.json(flashcards);
  } catch (error) {
    console.error("❌ Error fetching flashcards:", error);
    res.status(500).json({ error: "Failed to generate flashcards." });
  }
};

// ✅ Ensure all functions are correctly exported
module.exports = { logSong, getSongHistory, clearHistory, getFlashcardsForSong };