const Song = require("../models/Song"); // ✅ Import once
const { getLyricsFromGenius } = require("../services/geniusService");
const { fetchLyricsUrl } = require("../services/lyricsService"); // Import Genius search function

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

const axios = require("axios");


const getFlashcardsForSong = async (req, res) => {
  try {
    const songTitle = req.query.song;
    if (!songTitle) {
      return res.status(400).json({ error: "Song title is required" });
    }

    console.log(`🔎 Looking for song: ${songTitle}`);

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

    // ✅ Fetch Lyrics from Lyrics API
    const response = await fetch(`http://localhost:5001/api/lyrics/fetch-lyrics?lyricsUrl=${encodeURIComponent(song.lyricsUrl)}`);
    const data = await response.json();

    if (!data.lyrics || data.lyrics.trim().length === 0) {
      console.log(`❌ Failed to fetch lyrics for: ${songTitle}`);
      return res.status(500).json({ error: "Failed to fetch lyrics from Genius" });
    }

    console.log("🔍 Raw Lyrics Received:", data.lyrics);

    // ✅ 1️⃣ Remove section labels like [Verse 1], [Chorus]
    let cleanedLyrics = data.lyrics.replace(/\[.*?\]/g, "").trim();

    // ✅ 2️⃣ Split properly at punctuation or capital letters (avoid breaking mid-word)
    let lines = cleanedLyrics.split(/(?<=\w[.!?])\s+|(?<!\s)(?=[A-Z])/g);

    // ✅ 3️⃣ Fix broken parentheses and quotes
    let fixedLines = [];
    let tempLine = "";

    for (let line of lines) {
      if (line.endsWith("(") || line.startsWith(")") || line.endsWith("\"") || line.startsWith("\"")) {
        tempLine += " " + line;
      } else {
        if (tempLine) {
          fixedLines.push((tempLine + " " + line).trim());
          tempLine = "";
        } else {
          fixedLines.push(line.trim());
        }
      }
    }

    if (tempLine) {
      fixedLines.push(tempLine.trim());
    }

    // ✅ 4️⃣ Filter and Trim Each Line to Avoid Short Words
    let flashcards = fixedLines
      .filter(line => line.length > 3) // Remove too-short phrases
      .map(line => ({
        front: line,
        back: "Translation coming soon!" // Placeholder for translation
      }));

    console.log(`✅ Generated ${flashcards.length} flashcards for: ${songTitle}`);

    res.json(flashcards);
  } catch (error) {
    console.error("❌ Error fetching flashcards:", error);
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
};

// ✅ Ensure all functions are correctly exported
module.exports = { logSong, getSongHistory, clearHistory, getFlashcardsForSong };