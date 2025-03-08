const spotifyService = require("../services/spotifyService");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const User = require("../models/User");

// Use the enhanced scope definition from the service
// The redirect to Spotify's authorization page
const login = (req, res) => {
  const authUrl = spotifyService.getAuthorizationUrl();
  res.redirect(authUrl);
};

// Handle the Spotify OAuth callback
const handleSpotifyCallback = async (req, res) => {
  const { code } = req.query;
  const { userId } = req.query; // Pass userId in the redirect URL

  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const response = await spotifyService.exchangeCodeForToken(code);
    const accessToken = response.access_token;
    const refreshToken = response.refresh_token;
    const expiresIn = response.expires_in || 3600;
    
    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    
    // If userId is provided, store tokens in the database
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        spotifyConnected: true,
        spotifyTokens: {
          accessToken,
          refreshToken,
          expiresAt
        }
      });
    }

    // Redirect to frontend with tokens
    res.redirect(`${FRONTEND_URL}/?access_token=${accessToken}&refresh_token=${refreshToken}&userId=${userId}`);
  } catch (error) {
    console.error("❌ Spotify OAuth Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to authenticate with Spotify" });
  }
};

// Fetch the currently playing song with enhanced error handling
const getCurrentSong = async (req, res) => {
  try {
    let accessToken, refreshToken;
    
    // If authenticated user, try to get tokens from database first
    if (req.userId) {
      const user = await User.findById(req.userId);
      if (user && user.spotifyConnected) {
        accessToken = user.spotifyTokens.accessToken;
        refreshToken = user.spotifyTokens.refreshToken;
        
        // Check if token is expired and needs refresh
        if (user.spotifyTokens.expiresAt < new Date()) {
          console.log("🔄 Token expired, refreshing from database token");
          const newAccessToken = await spotifyService.refreshAccessToken(refreshToken);
          if (newAccessToken) {
            // Update token in database
            user.spotifyTokens.accessToken = newAccessToken;
            user.spotifyTokens.expiresAt = new Date(Date.now() + 3600 * 1000);
            await user.save();
            accessToken = newAccessToken;
          }
        }
      }
    }
    
    // Fall back to query params if database tokens aren't available
    if (!accessToken || !refreshToken) {
      accessToken = req.query.accessToken;
      refreshToken = req.query.refreshToken;
    }
    
    if (!accessToken || !refreshToken) {
      return res.status(400).json({ error: "Missing access token or refresh token" });
    }
    
    const songData = await spotifyService.fetchCurrentSong(accessToken, refreshToken);
    
    // Handle token refresh if needed
    if (songData.newAccessToken && req.userId) {
      const user = await User.findById(req.userId);
      if (user) {
        user.spotifyTokens.accessToken = songData.newAccessToken;
        user.spotifyTokens.expiresAt = new Date(Date.now() + 3600 * 1000);
        await user.save();
      }
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