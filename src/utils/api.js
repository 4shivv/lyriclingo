// src/utils/api.js

import { getAuthToken, clearAuthData } from './auth';

/**
 * Helper function to add authorization token to fetch requests
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options including method, headers, body, etc.
 * @returns {Promise} - Fetch promise with proper auth headers
 */
export const fetchWithAuth = async (url, options = {}) => {
  // Get the JWT token
  const token = getAuthToken();
  
  // Set up headers with authorization if token exists
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('No authentication token found. Request may fail if endpoint requires authentication.');
    // Instead of throwing, let the request proceed and handle auth error later
  }
  
  // Create the complete options object
  const fetchOptions = {
    ...options,
    headers
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    // Handle common authentication errors
    if (response.status === 401) {
      console.error('Authentication failed or token expired');
      clearAuthData(); // Clear all auth data
      
      // Determine if response contains JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication required. Please log in again.');
      } else {
        throw new Error('Authentication required. Please log in again.');
      }
    }
    
    // If response is not OK and not a 401 auth error
    if (!response.ok) {
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

/**
 * Helper function to handle API responses
 * @param {Response} response - Fetch API response
 * @returns {Promise} Promise resolving to parsed data
 */
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      clearAuthData();
      throw new Error('Authentication required. Please log in again.');
    }
    
    // Try to parse error message from JSON
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `Request failed with status: ${response.status}`);
    } catch (e) {
      // If parsing fails, use generic error
      throw new Error(`Request failed with status: ${response.status}`);
    }
  }
  
  try {
    // For 204 No Content
    if (response.status === 204) {
      return {};
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to parse response: ${error.message}`);
  }
};

/**
 * Makes API GET request with authentication
 * @param {string} url - API endpoint
 * @param {Object} options - Additional fetch options
 * @returns {Promise} Promise resolving to parsed data
 */
export const apiGet = async (url, options = {}) => {
  const response = await fetchWithAuth(url, {
    method: 'GET',
    ...options
  });
  return handleApiResponse(response);
};

/**
 * Makes API POST request with authentication
 * @param {string} url - API endpoint
 * @param {Object} data - POST data
 * @param {Object} options - Additional fetch options
 * @returns {Promise} Promise resolving to parsed data
 */
export const apiPost = async (url, data, options = {}) => {
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
  return handleApiResponse(response);
};

/**
 * Makes API DELETE request with authentication
 * @param {string} url - API endpoint
 * @param {Object} options - Additional fetch options
 * @returns {Promise} Promise resolving to parsed data
 */
export const apiDelete = async (url, options = {}) => {
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
    ...options
  });
  return handleApiResponse(response);
};