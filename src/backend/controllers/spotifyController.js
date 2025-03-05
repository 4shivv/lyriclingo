const spotifyService = require("../services/spotifyService");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Use the enhanced scope definition from the service
// The redirect to Spotify's authorization page
const login = (req, res) => {
  const authUrl = spotifyService.getAuthorizationUrl();
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

// Fetch the currently playing song with enhanced error handling
const getCurrentSong = async (req, res) => {
  const { accessToken, refreshToken } = req.query;
  
  if (!accessToken || !refreshToken) {
    return res.status(400).json({ error: "Missing access token or refresh token" });
  }
  
  try {
    const songData = await spotifyService.fetchCurrentSong(accessToken, refreshToken);
    
    // Enhanced user-friendly error handling
    if (songData.error) {
      let statusCode = 404;
      
      // Determine appropriate status code based on error type
      if (songData.authExpired) statusCode = 401;
      if (songData.rateLimited) statusCode = 429;
      if (songData.noActiveDevice) statusCode = 412; // Precondition Failed
      
      return res.status(statusCode).json({ 
        error: songData.error,
        authExpired: songData.authExpired || false,
        scopeIssue: songData.scopeIssue || false
      });
    }
    
    res.json(songData);
  } catch (error) {
    console.error("Error fetching current song:", error);
    res.status(500).json({ error: "Failed to fetch current song" });
  }
};

module.exports = { 
  loginToSpotify: login, 
  handleSpotifyCallback,
  getCurrentSong
};