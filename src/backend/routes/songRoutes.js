const express = require("express");
const { logSong, getSongHistory, clearHistory, getFlashcardsForSong, deleteSong, getSongSentiment } = require("../controllers/songController");

const router = express.Router();

router.post("/log", logSong);
router.get("/history", getSongHistory);
router.delete("/clear", clearHistory);
router.delete("/:id", deleteSong);
router.get("/flashcards", getFlashcardsForSong);
router.post("/logout", clearHistory);
router.get("/sentiment", getSongSentiment);

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
