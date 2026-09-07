/**
 * FitBite Central REST API Client
 * Manages HTTP communication with the Express backend, automatically handles
 * JWT Bearer token attachment, error normalization, and session expiration events.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Retrieves the stored JWT authentication token.
 * @returns {string|null}
 */
export const getToken = () => {
  try {
    return localStorage.getItem('fitbite_token');
  } catch (e) {
    return null;
  }
};

/**
 * Stores the JWT authentication token.
 * @param {string} token
 */
export const setToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('fitbite_token', token);
    } else {
      localStorage.removeItem('fitbite_token');
    }
  } catch (e) {
    console.error('Failed to access localStorage:', e);
  }
};

/**
 * Clears the stored JWT authentication token.
 */
export const clearToken = () => {
  try {
    localStorage.removeItem('fitbite_token');
    localStorage.removeItem('fitbite_user');
  } catch (e) {
    console.error('Failed to clear token:', e);
  }
};

/**
 * Custom Error class encapsulating backend API error payloads.
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, errors = [], raw = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.raw = raw;
  }
}

/**
 * Core fetch wrapper with header injection, response parsing, and error unwrapping.
 *
 * @param {string} endpoint - Relative API endpoint path (e.g. '/products', '/cart')
 * @param {Object} options - Standard fetch options
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  if (fetchOptions.body && typeof fetchOptions.body === 'object') {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError) {
    throw new ApiError(
      'Unable to connect to the FitBite server. Please check your internet connection.',
      0,
      [],
      networkError
    );
  }

  let payload = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch (parseError) {
      payload = null;
    }
  }

  // Handle Unauthorized (401) session expiration
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    clearToken();
    window.dispatchEvent(new CustomEvent('fitbite:session_expired'));
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      `Request failed with status ${response.status} (${response.statusText})`;
    const errors = payload?.errors || [];
    throw new ApiError(message, response.status, errors, payload);
  }

  return payload;
}

// Convenient HTTP Verb Helpers
export const api = {
  get: (endpoint, headers = {}) => request(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers = {}) => request(endpoint, { method: 'POST', body, headers }),
  put: (endpoint, body, headers = {}) => request(endpoint, { method: 'PUT', body, headers }),
  patch: (endpoint, body, headers = {}) => request(endpoint, { method: 'PATCH', body, headers }),
  delete: (endpoint, headers = {}) => request(endpoint, { method: 'DELETE', headers }),
};

export default api;
