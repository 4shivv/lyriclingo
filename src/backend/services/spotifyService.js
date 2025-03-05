const axios = require("axios");
require("dotenv").config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

const MAX_REFRESH_ATTEMPTS = 2;

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
 * Refresh Spotify Access Token
 */
const refreshAccessToken = async (refreshToken) => {
    let refreshAttempts = 0;
    
    try {
        if (!refreshToken) {
            console.error("❌ No refresh token provided");
            return null;
        }

        if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
            console.error("❌ Max refresh token attempts reached");
            return null;
        }
        
        refreshAttempts++;
        
        console.log("🔄 Attempting to refresh access token...");
        
        const response = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            params: {
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(
                    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
                ).toString('base64')}`
            }
        });
        
        if (response.data && response.data.access_token) {
            console.log("✅ Successfully refreshed access token");
            return response.data.access_token;
        } else {
            console.error("❌ Refresh response missing access token");
            return null;
        }
    } catch (error) {
        console.error("❌ Error refreshing access token:", 
            error.response ? 
            `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}` : 
            error.message
        );
        
        if (error.response) {
            if (error.response.status === 400) {
                console.error("❌ Invalid refresh token - user needs to re-authenticate");
                return null;
            }
            
            if (error.response.status === 401) {
                console.error("❌ Spotify API credentials error - check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET");
                return null;
            }
        }
        
        return null;
    }
};

/**
 * Fetch Currently Playing Song
 */
const fetchCurrentSong = async (userAccessToken, refreshToken) => {
    let refreshAttempts = 0;
    const MAX_REFRESH_ATTEMPTS = 2;
    
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
        if (error.response && error.response.status === 401 && refreshAttempts < MAX_REFRESH_ATTEMPTS) {
            console.log("🔄 Access token expired, refreshing...");
            refreshAttempts++;
            const newAccessToken = await refreshAccessToken(refreshToken);
            
            if (newAccessToken) {
                return fetchCurrentSong(newAccessToken, refreshToken); // Retry with new token
            } else {
                console.error("❌ Failed to refresh access token, authentication required");
                return { 
                    error: "Authentication expired. Please log in again.",
                    authExpired: true 
                };
            }
        }

        console.error("❌ Spotify API Error:", error.response ? error.response.data : error.message);
        return { error: "Failed to fetch song." };
    }
};

module.exports = { exchangeCodeForToken, refreshAccessToken, fetchCurrentSong };
