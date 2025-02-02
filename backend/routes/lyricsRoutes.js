const express = require("express");
const { getLyricsUrl, fetchLyrics } = require("../controllers/lyricsController");

const router = express.Router();

router.get("/get-lyrics-url", getLyricsUrl);
router.get("/fetch-lyrics", fetchLyrics);

module.exports = router; // ✅ Ensure correct export
