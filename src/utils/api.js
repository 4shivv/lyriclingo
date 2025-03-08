/**
 * Helper function to add authorization token to fetch requests
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options including method, headers, body, etc.
 * @returns {Promise} - Fetch promise with proper auth headers
 */
export const fetchWithAuth = async (url, options = {}) => {
  // Get the JWT token from localStorage
  const token = localStorage.getItem('token');
  
  // Set up headers with authorization if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('No authentication token found. Request may fail if endpoint requires authentication.');
  }
  
  // Create the complete options object
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
    
    // Handle common authentication errors
    if (response.status === 401) {
      console.error('Authentication token expired or invalid');
      // Optionally, you could implement automatic logout here
      // localStorage.removeItem('token');
      // window.location.href = '/login';
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