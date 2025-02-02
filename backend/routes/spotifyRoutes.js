const express = require("express");
const { loginToSpotify, handleSpotifyCallback, getCurrentSong } = require("../controllers/spotifyController");

const router = express.Router();

router.get("/login", loginToSpotify);
router.get("/callback", handleSpotifyCallback);
router.get("/current-song", getCurrentSong);

module.exports = router; // ✅ Ensure correct export
