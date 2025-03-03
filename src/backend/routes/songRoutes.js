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

module.exports = router; // ✅ Ensure correct export
