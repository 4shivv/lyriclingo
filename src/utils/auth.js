/**
 * Retrieves authentication token from available storage mechanisms
 * @returns {string|null} JWT token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("auth_token");
};

/**
 * Checks if the user is authenticated based on the presence of the authentication token
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};