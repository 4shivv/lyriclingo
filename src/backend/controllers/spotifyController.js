const spotifyService = require("../services/spotifyService");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// The desired Spotify scopes – adjust as needed
const scope = "user-read-email user-read-private";

// Redirect to Spotify's authorization page
const login = (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}` +
                  `&response_type=code&redirect_uri=${encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI)}` +
                  `&scope=${encodeURIComponent(scope)}`;
  res.redirect(authUrl);
};

// Handle the Spotify OAuth callback
const handleSpotifyCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const response = await spotifyService.exchangeCodeForToken(code);
    const accessToken = response.access_token;
    const refreshToken = response.refresh_token;

    // Redirect back to the frontend using the configured FRONTEND_URL
    res.redirect(`${FRONTEND_URL}/?access_token=${accessToken}&refresh_token=${refreshToken}`);
  } catch (error) {
    console.error("❌ Spotify OAuth Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to authenticate with Spotify" });
  }
};

// Get the current song the user is listening to
const getCurrentSong = async (req, res) => {
  res.status(501).json({ error: "Not implemented" });
};

module.exports = { 
  loginToSpotify: login, 
  handleSpotifyCallback,
  getCurrentSong
};
