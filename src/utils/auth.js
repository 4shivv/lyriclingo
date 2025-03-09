/**
 * Get user ID from JWT token
 * @returns {string|null} User ID or null if not found
 */
export const getUserId = () => {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    // Extract payload from JWT token (middle part between dots)
    const payload = token.split('.')[1];
    // Decode and parse
    const decoded = JSON.parse(atob(payload));
    return decoded.id; // User ID is stored in the 'id' field
  } catch (error) {
    console.error("Error extracting user ID from token:", error);
    return null;
  }
};

/**
 * Get authentication token from available storage mechanisms
 * @returns {string|null} JWT token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("auth_token");
};

/**
 * Checks if the user is authenticated based on token presence
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Stores authentication token consistently across storage mechanisms
 * @param {string} token - JWT token to store
 */
export const storeAuthToken = (token) => {
  if (!token) return;
  localStorage.setItem("token", token);
  sessionStorage.setItem("auth_token", token);
  sessionStorage.setItem("app_logged_in", "true");
  sessionStorage.removeItem("app_logged_out");
};

/**
 * Clears all authentication and user-specific data
 */
export const clearAuthData = () => {
  // Clear auth tokens
  localStorage.removeItem("token");
  sessionStorage.removeItem("auth_token");
  
  // Get user ID before clearing everything
  const userId = getUserId();
  
  // Clear Spotify tokens with user specificity
  if (userId) {
    localStorage.removeItem(`spotify_access_token:${userId}`);
    localStorage.removeItem(`spotify_refresh_token:${userId}`);
  }
  
  // Clear generic Spotify tokens as fallback
  localStorage.removeItem("spotify_access_token");
  localStorage.removeItem("spotify_refresh_token");
  
  // Clear session flags
  sessionStorage.removeItem("app_logged_in");
  sessionStorage.setItem("app_logged_out", "true");
  
  // Clear any other user-specific cached data
  clearUserCache(userId);
};

/**
 * Gets Spotify tokens for the current authenticated user
 * @returns {Object|null} Object with accessToken and refreshToken, or null if not found
 */
export const getSpotifyTokens = () => {
  const userId = getUserId();
  
  if (userId) {
    // Try user-specific tokens first
    const accessToken = localStorage.getItem(`spotify_access_token:${userId}`);
    const refreshToken = localStorage.getItem(`spotify_refresh_token:${userId}`);
    
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
  }
  
  // Fallback to generic tokens
  const accessToken = localStorage.getItem("spotify_access_token");
  const refreshToken = localStorage.getItem("spotify_refresh_token");
  
  if (accessToken && refreshToken) {
    // If found generic tokens, migrate them to user-specific (if we have userId)
    if (userId) {
      localStorage.setItem(`spotify_access_token:${userId}`, accessToken);
      localStorage.setItem(`spotify_refresh_token:${userId}`, refreshToken);
    }
    return { accessToken, refreshToken };
  }
  
  return null;
};

/**
 * Stores Spotify tokens with user association
 * @param {string} accessToken - Spotify access token
 * @param {string} refreshToken - Spotify refresh token
 */
export const storeSpotifyTokens = (accessToken, refreshToken) => {
  if (!accessToken || !refreshToken) return;
  
  const userId = getUserId();
  
  // Store with user association if possible
  if (userId) {
    localStorage.setItem(`spotify_access_token:${userId}`, accessToken);
    localStorage.setItem(`spotify_refresh_token:${userId}`, refreshToken);
  }
  
  // Also store generically as fallback
  localStorage.setItem("spotify_access_token", accessToken);
  localStorage.setItem("spotify_refresh_token", refreshToken);
};

/**
 * Clears cached data for a specific user
 * @param {string} userId - User ID
 */
export const clearUserCache = (userId) => {
  if (!userId) return;
  
  // Clear user-specific local storage items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(userId)) {
      localStorage.removeItem(key);
    }
  }
  
  // Clear user-specific session storage items
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.includes(userId)) {
      sessionStorage.removeItem(key);
    }
  }
};