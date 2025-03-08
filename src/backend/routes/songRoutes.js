const express = require("express");
const authMiddleware = require("../middleware/auth");
const { logSong, getSongHistory, clearHistory, getFlashcardsForSong, deleteSong, getSongSentiment } = require("../controllers/songController");

const router = express.Router();

// Protected routes require authentication
router.post("/log", authMiddleware, logSong);
router.get("/history", authMiddleware, getSongHistory);
router.delete("/clear", authMiddleware, clearHistory);
router.delete("/:id", authMiddleware, deleteSong);
router.get("/flashcards", authMiddleware, getFlashcardsForSong);
router.post("/logout", authMiddleware, clearHistory);
router.get("/sentiment", authMiddleware, getSongSentiment);

// Add this route to check API configuration
router.get("/check-sentiment-config", async (req, res) => {
  try {
    if (!process.env.HUGGINGFACE_API_TOKEN) {
      return res.status(500).json({ 
        error: "Hugging Face API token not configured",
        configured: false 
      });
    }
    res.json({ 
      message: "Sentiment analysis configuration OK",
      configured: true 
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Error checking sentiment configuration",
      configured: false 
    });
  }
});

module.exports = router; // ✅ Ensure correct export
