/**
 * Helper function to add authorization token to fetch requests
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options including method, headers, body, etc.
 * @returns {Promise} - Fetch promise with proper auth headers
 */
export const fetchWithAuth = async (url, options = {}) => {
  // Get JWT token with fallback options
  const token = localStorage.getItem('token') || sessionStorage.getItem("auth_token");
  
  if (!token) {
    console.warn('No authentication token found.');
    throw new Error('Authentication required');
  }
  
  // Create headers with authorization
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Cache-Control': 'no-cache',
    ...options.headers
  };
  
  // Create fetch options
  const fetchOptions = {
    ...options,
    headers
  };
  
  // Log request details if in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔐 Making authenticated request to: ${url}`);
  }
  
  try {
    const response = await fetch(url, fetchOptions);
    
    // Handle authentication errors
    if (response.status === 401) {
      console.error('Authentication token expired or invalid');
      throw new Error('Authentication expired. Please log in again.');
    }
    
    // Handle other errors
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status: ${response.status}`);
      } else {
        throw new Error(`Request failed with status: ${response.status}`);
      }
    }
    
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