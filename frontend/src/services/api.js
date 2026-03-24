import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add user ID if available
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    config.headers['X-User-ID'] = userId;
  }
  return config;
});

// Response error handler
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'API Error';
    console.error('API Error:', message);
    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

/**
 * Send chat query and get response with schemes
 * @param {string} query - User's natural language query
 * @param {object} userProfile - User profile { age, income, state, gender, occupation }
 * @returns {Promise<{response, eligibility, schemes}>}
 */
export const sendChat = (query, userProfile = {}) =>
  api.post('/chat', { query, userProfile });

/**
 * Save user profile
 * @param {object} profile - { age, income, state, gender, occupation }
 * @returns {Promise<{userId, profile, success}>}
 */
export const saveProfile = (profile) =>
  api.post('/profile', profile);

/**
 * Get schemes user is eligible for but hasn't asked about
 * @param {object} userProfile - User profile
 * @returns {Promise<{schemes}>}
 */
export const getMissedBenefits = (userProfile) =>
  api.get('/missed', { params: userProfile });

/**
 * Get detailed information about a specific scheme
 * @param {string} schemeId - ID of the scheme
 * @returns {Promise<scheme details>}
 */
export const getSchemeDetails = (schemeId) =>
  api.get(`/schemes/${schemeId}`);

/**
 * Get personalized alerts for user
 * @returns {Promise<{alerts}>}
 */
export const getAlerts = () =>
  api.get('/alerts');

/**
 * Check eligibility for a specific scheme
 * @param {string} schemeId - ID of the scheme
 * @param {object} userProfile - User profile
 * @returns {Promise<{eligible, reason}>}
 */
export const checkEligibility = (schemeId, userProfile) =>
  api.post(`/schemes/${schemeId}/check-eligibility`, { userProfile });

/**
 * Get application steps for a scheme
 * @param {string} schemeId - ID of the scheme
 * @returns {Promise<{steps, documents, links}>}
 */
export const getApplicationSteps = (schemeId) =>
  api.get(`/schemes/${schemeId}/apply`);

/**
 * Health check endpoint
 * @returns {Promise<{status}>}
 */
export const healthCheck = () =>
  api.get('/health');

export default api;
