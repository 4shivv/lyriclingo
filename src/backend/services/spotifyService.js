const axios = require("axios");
require("dotenv").config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// Global constant for max refresh attempts
const MAX_REFRESH_ATTEMPTS = 2;

// Enhanced scope string - critical for player data access
const REQUIRED_SCOPES = "user-read-email user-read-private user-read-playback-state user-read-currently-playing";

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

        // Log scopes for debugging (remove in production)
        if (response.data && response.data.scope) {
            console.log(`📋 Obtained scopes: ${response.data.scope}`);
        }

        return response.data; // Contains access_token, refresh_token & scope
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
            data: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }).toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(
                    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
                ).toString('base64')}`
            }
        });
        
        if (response.data && response.data.access_token) {
            // Log scopes for debugging if available
            if (response.data.scope) {
                console.log(`📋 Refreshed token scopes: ${response.data.scope}`);
            }
            
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
 * Validate player access and get Spotify user info
 * Checks if the token has sufficient permissions before attempting player API
 */
const validateSpotifyAccess = async (accessToken) => {
    try {
        // First try a lightweight API call to check token validity
        const response = await axios.get(
            "https://api.spotify.com/v1/me",
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );
        
        if (response.data && response.data.product) {
            // Log account type for debugging
            console.log(`✅ Spotify account type: ${response.data.product}`);
            
            // Return account info for additional checks
            return {
                valid: true,
                accountType: response.data.product, // 'premium' or 'free'
                id: response.data.id
            };
        }
        
        return { valid: true }; // Basic validation passed
    } catch (error) {
        console.error("❌ Token validation failed:", 
            error.response ? 
            `Status: ${error.response.status}, Error: ${JSON.stringify(error.response.data)}` : 
            error.message
        );
        
        return { 
            valid: false, 
            status: error.response?.status || 500,
            error: error.response?.data?.error || "Unknown error"
        };
    }
};

// Small delay function to prevent rate limiting
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch Currently Playing Song
 * Enhanced with account validation and proper error handling
 */
const fetchCurrentSong = async (userAccessToken, refreshToken) => {
    // Use a counter outside the recursive call
    let attemptsMade = 0;
    let currentToken = userAccessToken;
    
    while (attemptsMade < MAX_REFRESH_ATTEMPTS) {
        try {
            // First validate the token and check account type
            const validation = await validateSpotifyAccess(currentToken);
            
            if (!validation.valid) {
                if (validation.status === 401) {
                    // Token is invalid, try refreshing
                    console.log("🔄 Access token expired, refreshing...");
                    attemptsMade++;
                    
                    if (attemptsMade >= MAX_REFRESH_ATTEMPTS) {
                        console.error(`❌ Maximum refresh attempts (${MAX_REFRESH_ATTEMPTS}) reached. Authentication required.`);
                        return { 
                            error: "Authentication expired. Please log in again.",
                            authExpired: true 
                        };
                    }
                    
                    const newAccessToken = await refreshAccessToken(refreshToken);
                    if (!newAccessToken) {
                        return { 
                            error: "Authentication expired. Please log in again.",
                            authExpired: true 
                        };
                    }
                    
                    currentToken = newAccessToken;
                    
                    // Add a small delay before retry to prevent rate limiting
                    await wait(500);
                    continue;
                } else {
                    // Other validation errors
                    return { 
                        error: `Spotify account validation failed: ${validation.error?.message || "Unknown error"}`,
                        authExpired: false
                    };
                }
            }
            
            // Check if account is Free tier (which has limited player API access)
            if (validation.accountType === 'free') {
                console.log("⚠️ Free Spotify account detected - may have limited player API access");
            }
            
            // Now try to fetch the currently playing track
            console.log("🔍 Fetching currently playing track...");
            const response = await axios.get(
                "https://api.spotify.com/v1/me/player/currently-playing",
                {
                    headers: { Authorization: `Bearer ${currentToken}` },
                }
            );

            // Handle 204 No Content response (no track playing)
            if (response.status === 204) {
                console.log("⚠️ No song currently playing (204 No Content)");
                return { error: "No song currently playing." };
            }

            if (response.data && response.data.item) {
                console.log(`✅ Found currently playing: "${response.data.item.name}" by ${response.data.item.artists.map(a => a.name).join(", ")}`);
                return {
                    song: response.data.item.name,
                    artist: response.data.item.artists.map(artist => artist.name).join(", "),
                    album: response.data.item.album.name
                };
            } else {
                // Response OK but no track data
                console.log("⚠️ No song data in response");
                return { error: "No song currently playing." };
            }
        } catch (error) {
            // Handle specific error cases with better logging
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data?.error || {};
                
                console.error(`❌ Spotify API Error: ${status} - ${errorData.message || "Unknown error"}`);
                
                // Handle 401 Unauthorized (expired token)
                if (status === 401) {
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
                    
                    // Add a small delay before retry to prevent rate limiting
                    await wait(500);
                    continue;
                }
                
                // Handle 403 Forbidden (insufficient scopes)
                if (status === 403) {
                    console.error("❌ Insufficient permissions. User needs to re-authenticate with proper scopes.");
                    return { 
                        error: "Your Spotify account doesn't have the required permissions. Please log in again.",
                        authExpired: true,
                        scopeIssue: true
                    };
                }
                
                // Handle 429 Too Many Requests (rate limiting)
                if (status === 429) {
                    const retryAfter = error.response.headers['retry-after'] || 2;
                    console.error(`❌ Rate limited by Spotify. Retry after ${retryAfter} seconds.`);
                    return { 
                        error: `Rate limited by Spotify. Please try again in ${retryAfter} seconds.`,
                        rateLimited: true
                    };
                }
                
                // Player-specific errors
                if (status === 404 && errorData.reason === "NO_ACTIVE_DEVICE") {
                    console.error("❌ No active Spotify device found.");
                    return { 
                        error: "No active Spotify playback device found. Please start playing music in your Spotify app first.",
                        noActiveDevice: true
                    };
                }
            }

            // Fallback error handling
            console.error("❌ Failed to fetch song:", error.message);
            return { 
                error: "Failed to fetch current song. Please ensure Spotify is playing music and try again.",
                details: error.message
            };
        }
    }
    
    // This should only be reached if all attempts fail
    return { 
        error: "Unable to communicate with Spotify after multiple attempts.",
        authExpired: true 
    };
};

/**
 * Login to Spotify with enhanced scopes
 * Export this function to be used in the controller
 */
const getAuthorizationUrl = () => {
    return `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}` +
           `&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
           `&scope=${encodeURIComponent(REQUIRED_SCOPES)}`;
};

module.exports = { 
    exchangeCodeForToken, 
    refreshAccessToken, 
    fetchCurrentSong,
    getAuthorizationUrl // New export
};