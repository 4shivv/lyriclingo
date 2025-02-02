const spotifyService = require("../services/spotifyService");

// Redirect user to Spotify login
const loginToSpotify = (req, res) => {
    const scope = "user-read-currently-playing user-read-playback-state";
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    res.redirect(authUrl);
};

const handleSpotifyCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) return res.status(400).json({ error: "No code provided" });

    try {
        const response = await spotifyService.exchangeCodeForToken(code);
        const accessToken = response.access_token;
        const refreshToken = response.refresh_token;

        // Redirect back to React app with tokens as URL params
        res.redirect(`http://localhost:5173/?access_token=${accessToken}&refresh_token=${refreshToken}`);
    } catch (error) {
        console.error("❌ Spotify OAuth Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to authenticate with Spotify" });
    }
};



// Get the current song the user is listening to
const getCurrentSong = async (req, res) => {
    let accessToken = req.query.accessToken;
    let refreshToken = req.query.refreshToken;

    // ✅ Fallback to hardcoded tokens if missing
    if (!accessToken || !refreshToken) {
        accessToken = "BQBx_nZZ2Yu3rrqNn3RyuSaWKAr47kmpHqbLwsr-gDLjYMsRfNb4JcTMQ9d860E90Tesqxo8JbijqwTup5cfRs9UR_7NUxTelJemv3IDSZwszS3P8xi_HxweFmwPRIYzv8LofyusqXJ-KB4DZs5uTqWXV_fmSAYwPVPVv1fS7gXxYJOUMQMlVyO8eMp_oTXbPZlrswj1QeR8Ae9LK9KWYpnhDUwp";
        refreshToken = "AQBXvOtg63__h4d4o_IxXCUMNtnJ2j6R6n5Xi8ffjkPh11-gw5mHoHLm_IChHWZ7sshU_ABTuSPPHVCVTfWokjW8hlKAfdQnkwKHUJoV3Tn6OjIytA89zc4QRFUi0lJ6tKs";
    }

    const songData = await spotifyService.fetchCurrentSong(accessToken, refreshToken);
    res.json(songData);
};

module.exports = { loginToSpotify, handleSpotifyCallback, getCurrentSong };
