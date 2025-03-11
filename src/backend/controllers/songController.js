const Song = require("../models/Song");
const { getLyricsFromGenius } = require("../services/geniusService");
const { fetchLyricsUrl } = require("../services/lyricsService");
const { translateBatch, languageDetector } = require("../services/translationService");
const axios = require("axios");
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");
const { analyzeSentiment } = require("../services/sentimentService");

// Error listener for Redis connection
redis.on("error", (error) => {
  console.error("Redis error:", error);
});

// Use BACKEND_URL environment variable or request's host
const BACKEND_URL = process.env.BACKEND_URL;

/**
 * Generate cache keys for a user's song data
 * @param {string} userId - User ID
 * @param {string} songTitle - Song title
 * @param {string} artist - Artist name (optional)
 * @param {string} language - Language code (optional)
 * @returns {Object} Object containing different cache keys
 */
const generateCacheKeys = (userId, songTitle, artist = null, language = null) => {
  return {
    flashcards: `flashcards:${userId}:${songTitle}${language ? ':' + language : ''}`,
    sentiment: `sentiment:${userId}:${songTitle}${artist ? ':' + artist : ''}`,
    translations: `translations:${userId}:${songTitle}${language ? ':' + language : ''}`
  };
};

/**
 * Clear all caches related to a specific song
 * @param {string} userId - User ID
 * @param {string} songTitle - Song title 
 * @param {string} artist - Artist name (optional)
 */
const clearSongCaches = async (userId, songTitle, artist = null) => {
  if (!redis) return;
  
  try {
    const cacheKeys = generateCacheKeys(userId, songTitle, artist);
    
    // Build a list of language-specific keys to clear
    const languageKeys = [];
    const supportedLanguages = ['ES', 'FR', 'PT', 'IT', 'DE', 'JA', 'ZH', 'RU', 'KO'];
    
    // Add language-specific cache keys
    for (const lang of supportedLanguages) {
      languageKeys.push(`flashcards:${userId}:${songTitle}:${lang}`);
      languageKeys.push(`translations:${userId}:${songTitle}:${lang}`);
    }
    
    // Combine all keys to delete
    const keysToDelete = [
      cacheKeys.flashcards,
      cacheKeys.sentiment,
      cacheKeys.translations,
      ...languageKeys
    ];
    
    // Execute multi-delete
    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
      console.log(`🗑️ Cleared all caches for song "${songTitle}" (user: ${userId})`);
    }
  } catch (error) {
    console.error(`❌ Error clearing caches for song "${songTitle}":`, error);
  }
};

// Log a new song (triggered by user action) and fetch the lyrics URL
const logSong = async (req, res) => {
  try {
    const { song, artist } = req.body;
    const userId = req.userId;

    if (!song || !artist) {
      return res.status(400).json({ error: "Song and artist are required" });
    }

    console.log(`🎵 Logging song: ${song} by ${artist} for user: ${userId}`);

    // Check if song already exists FOR THIS USER
    let existingSong = await Song.findOne({ song, artist, user: userId });
    
    // If song exists, clear any existing caches for that song
    if (existingSong) {
      console.log("✅ Song already exists in user's history.");
      
      // Clear all caches for this song
      await clearSongCaches(userId, song, artist);
      
      return res.json({ message: "Song already exists!", song: existingSong });
    }

    // Fetch Genius Lyrics URL
    const lyricsUrl = await fetchLyricsUrl(song, artist);
    if (!lyricsUrl) {
      return res.status(404).json({ error: "Lyrics URL not found." });
    }

    // Store song with user reference
    const newSong = new Song({ song, artist, lyricsUrl, user: userId });
    await newSong.save();

    // Clear any existing user-specific cache for this song
    await clearSongCaches(userId, song, artist);
    
    res.json({ message: "Song logged successfully!", song: newSong });
  } catch (error) {
    console.error("❌ Error logging song:", error);
    res.status(500).json({ error: "Failed to log song." });
  }
};

// Get song history
const getSongHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const songs = await Song.find({ user: userId }).sort({ timestamp: -1 });
    res.json(songs);
  } catch (error) {
    console.error("❌ Error fetching song history:", error);
    res.status(500).json({ error: "Failed to fetch history." });
  }
};

// Clear song history
const clearHistory = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get all songs for this user before deleting them (for cache clearing)
    const userSongs = await Song.find({ user: userId });
    
    // Delete all songs for this user
    await Song.deleteMany({ user: userId });
    
    // Clear all cache entries for this user's songs
    if (redis) {
      // Clear caches for each song individually
      const clearPromises = userSongs.map(song => 
        clearSongCaches(userId, song.song, song.artist)
      );
      
      await Promise.all(clearPromises);
      console.log(`🗑️ Cleared all song caches for user ${userId}`);
    }
    
    res.json({ message: "History and cache cleared!" });
  } catch (error) {
    console.error("❌ Error clearing history:", error);
    res.status(500).json({ error: "Failed to clear history." });
  }
};

// Get flashcards for a specific song
const getFlashcardsForSong = async (req, res) => {
  try {
    const songTitle = req.query.song;
    const forceLanguage = req.query.lang; // Optional override parameter
    const userId = req.userId;
    const cacheKeys = generateCacheKeys(userId, songTitle, null, forceLanguage);

    // Check Redis cache first
    const cachedFlashcards = await redis.get(cacheKeys.flashcards);
    if (cachedFlashcards) {
      console.log(`⚡ Serving flashcards from cache for: ${songTitle}`);
      return res.json(JSON.parse(cachedFlashcards));
    }

    console.log(`🔎 Looking for song: ${songTitle}`);

    // Find song in the DB
    const song = await Song.findOne({ song: songTitle, user: userId });
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

    // Process lyrics to remove section markers and handle special cases
    const lyricsLines = data.lyrics.split('\n')
      .map(line => {
        // Remove any section markers with or without quotes
        const cleanLine = line.replace(/"?\[.*?\]"?/g, '').trim();
        return cleanLine;
      })
      // Only keep non-empty lines after section marker removal
      .filter(line => line.length > 0);
    
    console.log(`📝 Found ${lyricsLines.length} lyric lines after removing section markers`);

    // Prepare arrays for translation
    let frontLines = lyricsLines;
    
    // Step 1: Create a map of unique lines for translation efficiency
    const uniqueLines = new Map(); // Maps text to index in uniqueArray
    const uniqueArray = []; // Stores unique lyric lines
    const originalToUnique = new Map(); // Maps original position to unique line index
    
    // Identify unique lines while preserving all original lines
    frontLines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!uniqueLines.has(trimmedLine)) {
        // New unique line found
        uniqueLines.set(trimmedLine, uniqueArray.length);
        uniqueArray.push(trimmedLine);
      }
      
      // Map this position to its corresponding unique line
      originalToUnique.set(index, uniqueLines.get(trimmedLine));
    });
    
    // Calculate and log translation optimization stats
    const totalLines = frontLines.length;
    const uniqueCount = uniqueArray.length;
    const savedLines = totalLines - uniqueCount;
    const percentSaved = Math.round((savedLines / totalLines) * 100);
    
    console.log(`🔍 Translation Optimization: ${totalLines} total lines → ${uniqueCount} unique lines to translate (saved ${percentSaved}% API usage)`);
    
    // Step 2: Automatically detect language from the combined lyrics
    // Use forceLanguage if explicitly provided in the request
    let detectedOrForcedLanguage = forceLanguage;
    if (!detectedOrForcedLanguage) {
      // Create a sample text for language detection (first 10 unique lines or fewer)
      const sampleText = uniqueArray.slice(0, Math.min(10, uniqueArray.length)).join(" ");
      detectedOrForcedLanguage = languageDetector.detectLanguage(sampleText);
      console.log(`🔤 Auto-detected language: ${detectedOrForcedLanguage}`);
    } else {
      console.log(`🔤 Using forced language: ${detectedOrForcedLanguage}`);
    }
    
    // Check if we have cached translations first
    const translationsCacheKey = cacheKeys.translations;
    const cachedTranslations = await redis.get(translationsCacheKey);
    
    let uniqueTranslations = [];
    
    if (cachedTranslations) {
      console.log(`⚡ Using cached translations for: ${songTitle}`);
      uniqueTranslations = JSON.parse(cachedTranslations);
    } else {
      // Step 3: Translate only the unique lines in batches
      const BATCH_SIZE = 10; // Number of lines to translate in each API call
      
      // Process unique lines in batches
      for (let i = 0; i < uniqueArray.length; i += BATCH_SIZE) {
        const batch = uniqueArray.slice(i, i + BATCH_SIZE);
        console.log(`🔤 Translating unique batch ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} lines)`);
        
        // Send the batch for translation with the detected/forced language
        const translatedBatch = await translateBatch(batch, detectedOrForcedLanguage);
        
        // Add translated lines to unique translations array
        uniqueTranslations.push(...translatedBatch);
      }
      
      // Store translations in Redis (without expiration)
      await redis.set(translationsCacheKey, JSON.stringify(uniqueTranslations));
      console.log(`💾 Cached translations for: ${songTitle}`);
    }
    
    // Step 4: Map translations back to ALL original lines (including duplicates)
    const backLines = frontLines.map((_, index) => {
      // Get the unique line index for this position
      const uniqueIndex = originalToUnique.get(index);
      // Return the translation for this unique line
      return uniqueTranslations[uniqueIndex] || "Translation unavailable";
    });
    
    // Create flashcards with proper alignment, keeping ALL lines in order
    let flashcards = frontLines.map((line, index) => {
      return {
        front: line.trim(),
        // Extra cleaning to remove any potential artifact characters from translation
        back: backLines[index].trim().replace(/\|+/g, '').trim()
      };
    });
    
    // Track filtering statistics for debugging
    const initialCount = flashcards.length;
    let emptyCount = 0;
    let identicalCount = 0;
    let sectionMarkerCount = 0;
    
    // Track identical translations but keep them in the results
    flashcards.forEach(card => {
      if (card.front === card.back) {
        identicalCount++;
        // Optionally add a marker to the card
        card.isIdentical = true;
      }
    });

    // Final filter to ensure quality flashcards with detailed tracking
    flashcards = flashcards.filter(card => {
      // Check for empty front or back
      if (card.front.length === 0 || card.back.length === 0) {
        emptyCount++;
        return false;
      }
      
      // Check for section markers that might have slipped through
      if (/^\[.*\]$/.test(card.front) || /^\[.*\]$/.test(card.back)) {
        sectionMarkerCount++;
        return false;
      }
      
      return true;
    });

    // Log detailed filtering statistics
    const filteredCount = initialCount - flashcards.length;
    console.log(`✅ Created ${flashcards.length} clean flashcards from ${initialCount} lines (filtered ${filteredCount} problematic lines)`);
    
    if (filteredCount > 0) {
      console.log(`📊 Filtering breakdown: ${emptyCount} empty lines, ${identicalCount} identical translations (kept), ${sectionMarkerCount} section markers`);
    }
    
    // Add detected language to first flashcard for client reference
    if (flashcards.length > 0) {
      flashcards[0].detectedLanguage = detectedOrForcedLanguage;
    }
    
    // Cache the flashcards (without expiration)
    await redis.set(cacheKeys.flashcards, JSON.stringify(flashcards));
    console.log(`💾 Cached flashcards for: ${songTitle}`);

    res.json(flashcards);
  } catch (error) {
    console.error("❌ Error fetching flashcards:", error);
    res.status(500).json({ error: "Failed to generate flashcards." });
  }
};

// Delete a specific song
const deleteSong = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Get the song before deleting it so we have the song title
    const song = await Song.findById(id);
    
    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }
    
    // Delete the song from database
    await Song.findByIdAndDelete(id);
    
    // Clear all caches for this song
    await clearSongCaches(userId, song.song, song.artist);
    
    res.json({ 
      message: "Song deleted successfully!",
      songId: id,
      songTitle: song.song
    });
  } catch (error) {
    console.error("Error deleting song:", error);
    res.status(500).json({ error: "Failed to delete song." });
  }
};

// Get sentiment analysis for a song
const getSongSentiment = async (req, res) => {
  try {
    const { song, artist } = req.query;
    const userId = req.userId;
    
    if (!song) {
      return res.status(400).json({ error: "Song title is required" });
    }
    
    // Check if the song exists in THIS user's history
    const userSong = await Song.findOne({ 
      song: song, 
      user: userId 
    });
    
    if (!userSong) {
      return res.status(404).json({ 
        error: "Song not found in your history. Please log the song first." 
      });
    }
    
    // Check Redis cache with user-specific key
    const cacheKeys = generateCacheKeys(userId, song, artist);
    const cachedSentiment = await redis.get(cacheKeys.sentiment);
    
    if (cachedSentiment) {
      console.log(`⚡ Serving sentiment analysis from cache for: ${song}`);
      return res.json(JSON.parse(cachedSentiment));
    }
    
    console.log(`🔍 Starting sentiment analysis for song: "${song}"`);
    
    // Check for cached translations first to avoid redundant translation
    const translationsCacheKey = generateCacheKeys(userId, song, null).translations;
    const cachedTranslations = await redis.get(translationsCacheKey);
    
    let flashcards;
    
    if (cachedTranslations) {
      console.log(`⚡ Using cached translations for sentiment analysis: ${song}`);
      
      // Get lyrics for creating flashcards from translations
      const normalizedBackendUrl = process.env.BACKEND_URL
        ? (process.env.BACKEND_URL.startsWith("http") ? process.env.BACKEND_URL : `https://${process.env.BACKEND_URL}`)
        : `${req.protocol}://${req.get('host')}`;
      
      // Fetch lyrics
      const lyricsResponse = await fetch(
        `${normalizedBackendUrl}/api/lyrics/fetch-lyrics?lyricsUrl=${encodeURIComponent(userSong.lyricsUrl)}`,
        {
          headers: {
            "Authorization": req.headers.authorization
          }
        }
      );
      
      if (!lyricsResponse.ok) {
        throw new Error(`Failed to fetch lyrics: ${lyricsResponse.status}`);
      }
      
      const lyricsData = await lyricsResponse.json();
      
      // Process lyrics to create flashcards with cached translations
      const lyricsLines = lyricsData.lyrics.split('\n')
        .map(line => {
          // Remove section markers
          const cleanLine = line.replace(/"?\[.*?\]"?/g, '').trim();
          return cleanLine;
        })
        .filter(line => line.length > 0);
      
      const uniqueTranslations = JSON.parse(cachedTranslations);
      
      // Create a map of original lines to unique indices
      const uniqueLines = new Map();
      const uniqueArray = [];
      const originalToUnique = new Map();
      
      // Identify unique lines while preserving all original lines
      lyricsLines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        if (!uniqueLines.has(trimmedLine)) {
          uniqueLines.set(trimmedLine, uniqueArray.length);
          uniqueArray.push(trimmedLine);
        }
        
        originalToUnique.set(index, uniqueLines.get(trimmedLine));
      });
      
      // Map translations back to original lines
      const backLines = lyricsLines.map((_, index) => {
        const uniqueIndex = originalToUnique.get(index);
        return uniqueIndex < uniqueTranslations.length ? uniqueTranslations[uniqueIndex] : "Translation unavailable";
      });
      
      // Create flashcards
      flashcards = lyricsLines.map((line, index) => {
        return {
          front: line.trim(),
          back: backLines[index].trim().replace(/\|+/g, '').trim()
        };
      }).filter(card => card.front.length > 0 && card.back.length > 0);
      
      console.log(`✅ Created ${flashcards.length} flashcards from cached translations for sentiment analysis`);
    } else {
      // If no cached translations, generate flashcards from scratch
      flashcards = await generateFlashcards(userSong, req);
    }
    
    if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return res.status(404).json({ error: "No lyrics found for this song" });
    }
    
    // OPTIMIZATION: Deduplicate flashcard translations before analysis
    const uniqueTranslations = new Set();
    
    // Filter out duplicate translations
    const uniqueFlashcards = flashcards.filter(card => {
      if (!card.back || card.back.trim().length < 2) return false;
      
      const normalizedText = card.back.trim().toLowerCase();
      if (uniqueTranslations.has(normalizedText)) {
        return false;
      }
      
      uniqueTranslations.add(normalizedText);
      return true;
    });
    
    console.log(`🔍 Deduplication: ${flashcards.length} flashcards → ${uniqueFlashcards.length} unique translations`);
    
    // Combine translated text for sentiment analysis
    const englishText = uniqueFlashcards.map(card => card.back.trim()).join(". ");
    
    // Analyze sentiment
    let sentimentResult;
    try {
      sentimentResult = await analyzeSentiment(englishText);
      console.log(`✅ Sentiment analysis for "${song}": ${sentimentResult.sentiment}`);
    } catch (sentimentError) {
      console.error(`❌ Sentiment analysis failed for "${song}":`, sentimentError);
      
      // Provide neutral fallback
      sentimentResult = {
        sentiment: "Neutral",
        emoji: "😐",
        score: "0.50",
        emotions: [],
        primaryEmotion: "Unknown",
        emotionScore: "0.00",
        error: "Analysis service unavailable",
        fallback: true
      };
    }
    
    // Add song metadata
    sentimentResult.songMetadata = {
      title: song,
      artist: artist || userSong.artist || "Unknown Artist"
    };
    
    // Cache the sentiment result (without expiration)
    await redis.set(cacheKeys.sentiment, JSON.stringify(sentimentResult));
    console.log(`💾 Cached sentiment for user ${userId}: "${song}"`);
    
    res.json(sentimentResult);
  } catch (error) {
    console.error("Error analyzing song sentiment:", error);
    res.status(500).json({ 
      error: "Failed to analyze song sentiment: " + error.message,
      fallback: {
        sentiment: "Unknown",
        emoji: "❓",
        score: "0.00",
        emotions: [],
        primaryEmotion: "Unknown",
        emotionScore: "0.00"
      }
    });
  }
};

// Helper function to generate flashcards
async function generateFlashcards(song, req) {
  try {
    const lyricsUrl = song.lyricsUrl;
    
    if (!lyricsUrl) {
      throw new Error("Song has no lyrics URL");
    }
    
    // Use normalized backend URL
    const normalizedBackendUrl = process.env.BACKEND_URL
      ? (process.env.BACKEND_URL.startsWith("http") ? process.env.BACKEND_URL : `https://${process.env.BACKEND_URL}`)
      : `${req.protocol}://${req.get('host')}`;
    
    // Fetch lyrics 
    const lyricsResponse = await fetch(
      `${normalizedBackendUrl}/api/lyrics/fetch-lyrics?lyricsUrl=${encodeURIComponent(lyricsUrl)}`,
      {
        headers: {
          "Authorization": req.headers.authorization
        }
      }
    );
    
    if (!lyricsResponse.ok) {
      const errorText = await lyricsResponse.text();
      throw new Error(`Failed to fetch lyrics: ${lyricsResponse.status} - ${errorText}`);
    }
    
    const lyricsData = await lyricsResponse.json();
    
    if (!lyricsData.lyrics || lyricsData.lyrics.trim().length === 0) {
      throw new Error("No lyrics content received");
    }
    
    console.log("🔍 Lyrics received, processing for translation");
    
    // Process lyrics to create flashcards
    const lyricsLines = lyricsData.lyrics.split('\n')
      .map(line => {
        // Remove section markers
        const cleanLine = line.replace(/"?\[.*?\]"?/g, '').trim();
        return cleanLine;
      })
      .filter(line => line.length > 0);
    
    // Detect language
    const sampleText = lyricsLines.slice(0, Math.min(10, lyricsLines.length)).join(" ");
    const detectedLanguage = languageDetector.detectLanguage(sampleText);
    console.log(`🔤 Detected language: ${detectedLanguage}`);
    
    // Prepare for translation
    const uniqueLines = new Map();
    const uniqueArray = [];
    
    // Deduplicate lines
    lyricsLines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!uniqueLines.has(trimmedLine) && trimmedLine.length > 0) {
        uniqueLines.set(trimmedLine, uniqueArray.length);
        uniqueArray.push(trimmedLine);
      }
    });
    
    console.log(`🔍 Translation: ${lyricsLines.length} total lines → ${uniqueArray.length} unique lines to translate`);
    
    // Translate in batches
    const BATCH_SIZE = 10;
    const uniqueTranslations = [];
    
    for (let i = 0; i < uniqueArray.length; i += BATCH_SIZE) {
      const batch = uniqueArray.slice(i, i + BATCH_SIZE);
      console.log(`🔤 Translating batch ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} lines)`);
      
      const translatedBatch = await translateBatch(batch, detectedLanguage);
      uniqueTranslations.push(...translatedBatch);
    }
    
    // Create flashcards
    const flashcards = lyricsLines.map((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;
      
      const translationIndex = uniqueLines.get(trimmedLine);
      const translation = uniqueTranslations[translationIndex] || "Translation unavailable";
      
      return {
        front: trimmedLine,
        back: translation.trim().replace(/\|+/g, '').trim()
      };
    }).filter(card => card !== null);
    
    console.log(`✅ Created ${flashcards.length} flashcards for sentiment analysis`);
    
    // Cache the translations
    const userId = req.userId;
    const translationsCacheKey = generateCacheKeys(userId, song.song).translations;
    await redis.set(translationsCacheKey, JSON.stringify(uniqueTranslations));
    
    return flashcards;
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw error;
  }
}

module.exports = { 
  logSong, 
  getSongHistory, 
  clearHistory, 
  getFlashcardsForSong, 
  deleteSong, 
  getSongSentiment 
};