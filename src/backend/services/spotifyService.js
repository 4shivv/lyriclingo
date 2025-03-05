const axios = require("axios");
require("dotenv").config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// Global constant for max refresh attempts
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
    try {
        if (!refreshToken) {
            console.error("❌ No refresh token provided");
            return null;
        }
        
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
 * Non-recursive implementation with proper attempt tracking
 */
const fetchCurrentSong = async (userAccessToken, refreshToken) => {
    // Use a counter outside the recursive call
    let attemptsMade = 0;
    let currentToken = userAccessToken;
    
    while (attemptsMade < MAX_REFRESH_ATTEMPTS) {
        try {
            const response = await axios.get(
                "https://api.spotify.com/v1/me/player/currently-playing",
                {
                    headers: { Authorization: `Bearer ${currentToken}` },
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
            // Handle 401 Unauthorized error (expired token)
            if (error.response && error.response.status === 401) {
                console.log("🔄 Access token expired, refreshing...");
                attemptsMade++;
                
                // Check if we've hit the maximum attempts
                if (attemptsMade >= MAX_REFRESH_ATTEMPTS) {
                    console.error(`❌ Maximum refresh attempts (${MAX_REFRESH_ATTEMPTS}) reached. Authentication required.`);
                    return { 
                        error: "Authentication expired. Please log in again.",
                        authExpired: true 
                    };
                }
                
                // Try to refresh the token
                const newAccessToken = await refreshAccessToken(refreshToken);
                
                if (!newAccessToken) {
                    console.error("❌ Failed to refresh access token, authentication required");
                    return { 
                        error: "Authentication expired. Please log in again.",
                        authExpired: true 
                    };
                }
                
                // Update the token for the next iteration
                currentToken = newAccessToken;
                
                // Continue to the next iteration (will retry with new token)
                continue;
            }

            // Handle other types of errors
            console.error("❌ Spotify API Error:", error.response ? error.response.data : error.message);
            return { error: "Failed to fetch song." };
        }
    }
    
    // This should only be reached if all attempts fail
    return { 
        error: "Unable to communicate with Spotify after multiple attempts.",
        authExpired: true 
    };
};

module.exports = { exchangeCodeForToken, refreshAccessToken, fetchCurrentSong };