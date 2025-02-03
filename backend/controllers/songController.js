const Song = require("../models/Song"); // ✅ Import once
const { getLyricsFromGenius } = require("../services/geniusService");
const { fetchLyricsUrl } = require("../services/lyricsService"); // Import Genius search function
const { translateBatch } = require("../services/translationService"); // ✅ Import batch translation
const axios = require("axios");

// ✅ Log a new song and automatically fetch the lyrics URL
const logSong = async (req, res) => {
  try {
    const { song, artist } = req.body;

    if (!song || !artist) {
      return res.status(400).json({ error: "Song and artist are required" });
    }

    console.log(`🎵 Logging song: ${song} by ${artist}`);

    // ✅ Check if song is already in the database
    let existingSong = await Song.findOne({ song, artist });

    if (existingSong) {
      console.log("✅ Song already exists in history.");
      return res.json({ message: "Song already exists!", song: existingSong });
    }

    // ✅ Fetch Genius Lyrics URL
    console.log(`🔍 Searching for Genius lyrics URL for: ${song} by ${artist}`);
    const lyricsUrl = await fetchLyricsUrl(song, artist);

    if (!lyricsUrl) {
      console.log("❌ Genius lyrics URL not found.");
      return res.status(404).json({ error: "Lyrics URL not found." });
    }

    console.log(`✅ Found lyrics URL: ${lyricsUrl}`);

    // ✅ Store song with lyrics URL in MongoDB
    const newSong = new Song({ song, artist, lyricsUrl });
    await newSong.save();

    console.log("✅ Song logged successfully!");
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
    await Song.deleteMany({});
    res.json({ message: "History cleared!" });
  } catch (error) {
    console.error("❌ Error clearing history:", error);
    res.status(500).json({ error: "Failed to clear history." });
  }
};


const getFlashcardsForSong = async (req, res) => {
  try {
    const songTitle = req.query.song;
    const sourceLanguage = req.query.lang || "es"; // Default to Spanish input

    if (!songTitle) {
      return res.status(400).json({ error: "Song title is required" });
    }

    console.log(`🔎 Looking for song: ${songTitle}`);

    // Find the song in your database
    const song = await Song.findOne({ song: songTitle });
    if (!song) {
      console.log(`❌ Song not found in database: ${songTitle}`);
      return res.status(404).json({ error: "Song not found in history" });
    }
    if (!song.lyricsUrl) {
      console.log(`❌ No lyrics URL found for song: ${songTitle}`);
      return res.status(404).json({ error: "Lyrics URL not found for this song" });
    }
    console.log(`✅ Found song in DB with lyrics URL: ${song.lyricsUrl}`);

    // Fetch lyrics from your Lyrics API
    const response = await fetch(
      `http://localhost:5001/api/lyrics/fetch-lyrics?lyricsUrl=${encodeURIComponent(
        song.lyricsUrl
      )}`
    );
    const data = await response.json();
    if (!data.lyrics || data.lyrics.trim().length === 0) {
      console.log(`❌ Failed to fetch lyrics for: ${songTitle}`);
      return res
        .status(500)
        .json({ error: "Failed to fetch lyrics from Genius" });
    }
    console.log("🔍 Raw Lyrics Received:", data.lyrics);

    // 1️⃣ Clean the lyrics:
    //    - Remove section labels like [Verse 1] or [Chorus]
    //    - Replace multiple spaces with a single space
    let cleanedLyrics = data.lyrics
      .replace(/\[.*?\]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // 2️⃣ Translate the full lyrics as a single block
    let translatedResult = await translateBatch([cleanedLyrics], sourceLanguage);
    let translatedLyrics = translatedResult[0] || "Translation unavailable";

    // 3️⃣ Split both original and translated texts using your regex.
    // This regex splits on punctuation (if followed by whitespace) or before capital letters.
    const splitRegex = /(?<=\w[.!?])\s+|(?<!\s)(?=[A-Z])/g;
    let frontLines = cleanedLyrics.split(splitRegex).filter(line => line.trim().length > 0);
    let backLines = translatedLyrics.split(splitRegex).filter(line => line.trim().length > 0);

    // 4️⃣ Option 2: Post-process the split segments
    // If the first segment in the original is just an isolated punctuation mark (e.g., "¿" or "¡"),
    // merge it with the next segment.
    if (frontLines.length > 1 && frontLines[0].trim().match(/^[¿¡]$/)) {
      frontLines[1] = frontLines[0].trim() + " " + frontLines[1].trim();
      frontLines.shift();
    }

    // Optionally, check the translated lines in the same way if needed.
    if (backLines.length > 1 && backLines[0].trim().match(/^[¿¡]$/)) {
      backLines[1] = backLines[0].trim() + " " + backLines[1].trim();
      backLines.shift();
    }

    console.log(`🔹 Split Original Lyrics into ${frontLines.length} segments`);
    console.log(`🔹 Split Translated Lyrics into ${backLines.length} segments`);

    // 5️⃣ Adjust for mismatches in the number of lines:
    // If the translation has fewer segments, pad with a fallback.
    // If there are extra segments, trim them.
    while (backLines.length < frontLines.length) {
      backLines.push("Translation unavailable");
    }
    while (backLines.length > frontLines.length) {
      backLines.pop();
    }

    // 6️⃣ Create flashcards pairing each original line with its translation.
    let flashcards = frontLines.map((line, index) => ({
      front: line.trim(),
      back: (backLines[index] || "Translation unavailable").trim()
    }));

    console.log(`✅ Generated ${flashcards.length} flashcards for: ${songTitle}`);
    res.json(flashcards);
  } catch (error) {
    console.error("❌ Error fetching flashcards:", error);
    res.status(500).json({ error: "Failed to generate flashcards." });
  }
};


// ✅ Ensure all functions are correctly exported
module.exports = { logSong, getSongHistory, clearHistory, getFlashcardsForSong };