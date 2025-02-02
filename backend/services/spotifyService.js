const axios = require("axios");
require("dotenv").config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

/**
 * Exchange Authorization Code for an Access Token
 */
const exchangeCodeForToken = async (code) => {
    try {
        const response = await axios.post(
            "https://accounts.spotify.com/api/token",
            new URLSearchParams({
                code: code,
                redirect_uri: REDIRECT_URI,
                grant_type: "authorization_code",
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
                },
            }
        );

        return response.data; // Contains access_token & refresh_token
    } catch (error) {
        console.error("❌ Failed to exchange code for token:", error.response ? error.response.data : error.message);
        throw new Error("Failed to exchange code for token");
    }
};

/**
 * Refresh Expired Access Token
 */
const refreshAccessToken = async (refreshToken) => {
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);
    params.append("client_id", process.env.SPOTIFY_CLIENT_ID);
    params.append("client_secret", process.env.SPOTIFY_CLIENT_SECRET);

    try {
        const response = await axios.post("https://accounts.spotify.com/api/token", params, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        return response.data.access_token; // Return new access token
    } catch (error) {
        console.error("❌ Failed to refresh Spotify token:", error.response.data);
        return null;
    }
};

/**
 * Fetch Currently Playing Song
 */
const fetchCurrentSong = async (userAccessToken, refreshToken) => {
    try {
        let response = await axios.get(
            "https://api.spotify.com/v1/me/player/currently-playing",
            {
                headers: { Authorization: `Bearer ${userAccessToken}` },
            }
        );

        if (response.data && response.data.item) {
            return {
                song: response.data.item.name,
                artist: response.data.item.artists.map(artist => artist.name).join(", "),
                album: response.data.item.album.name
            };
        } else {
            console.log("⚠️ No song currently playing.");
            return { error: "No song currently playing." };
        }
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log("🔄 Access token expired, refreshing...");
            const newAccessToken = await refreshAccessToken(refreshToken);
            if (newAccessToken) {
                return fetchCurrentSong(newAccessToken, refreshToken); // Retry with new token
            } else {
                return { error: "Failed to refresh access token." };
            }
        }

        console.error("❌ Spotify API Error:", error.response ? error.response.data : error.message);
        return { error: "Failed to fetch song." };
    }
};

module.exports = { exchangeCodeForToken, refreshAccessToken, fetchCurrentSong };
