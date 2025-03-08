/**
 * Helper function to add authorization token to fetch requests
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options including method, headers, body, etc.
 * @returns {Promise} - Fetch promise with proper auth headers
 */
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem("auth_token");
  
  if (!token) {
    // Clear Spotify tokens as well on auth failure
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    
    console.warn('No authentication token found. Request may fail if endpoint requires authentication.');
    throw new Error('Authentication required');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  
  // Log request details if in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔐 Making authenticated request to: ${url}`);
  }
  
  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      // Clear ALL tokens on auth failure
      localStorage.removeItem('token');
      sessionStorage.removeItem("auth_token");
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_refresh_token");
      
      sessionStorage.setItem("app_logged_out", "true");
      throw new Error('Authentication expired');
    }
    
    // If response is not OK and not a 401 auth error
    if (!response.ok && response.status !== 401) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status: ${response.status}`);
      } else {
        throw new Error(`Request failed with status: ${response.status}`);
      }
    }
    
    // If everything is fine, return the response for further processing
    return response;
  } catch (error) {
    console.error('Fetch error:', error.message);
    throw error;
  }
};

// Usage example:
// 
// // GET request with auth
// const fetchData = async () => {
//   try {
//     const response = await fetchWithAuth(`${backendUrl}/api/protected-endpoint`);
//     const data = await response.json();
//     // Process data...
//   } catch (error) {
//     // Handle error...
//   }
// };
// 
// // POST request with auth
// const postData = async (data) => {
//   try {
//     const response = await fetchWithAuth(`${backendUrl}/api/protected-endpoint`, {
//       method: 'POST',
//       body: JSON.stringify(data)
//     });
//     const result = await response.json();
//     // Process result...
//   } catch (error) {
//     // Handle error...
//   }
// }; 