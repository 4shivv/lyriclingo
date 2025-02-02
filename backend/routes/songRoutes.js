const express = require("express");
const { logSong, getSongHistory, clearHistory, getFlashcardsForSong } = require("../controllers/songController");

const router = express.Router();

router.post("/log", logSong);
router.get("/history", getSongHistory);
router.delete("/clear", clearHistory);
router.get("/flashcards", getFlashcardsForSong);

module.exports = router; // ✅ Ensure correct export
