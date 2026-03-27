import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // FastAPI backend

// Configure axios with reasonable timeout
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Helper to transform backend response to frontend format
const transformSchemeResponse = (backendSchemes) => {
  return backendSchemes.map((scheme) => ({
    id: scheme.id,
    name: scheme.name,
    description: scheme.description,
    eligible: scheme.eligible || false,
    benefits: scheme.benefits || [],
    steps: scheme.steps ? scheme.steps.split('\n') : [],
    documents: scheme.documents || [],
    timeline: scheme.timeline || 'Varies',
    source: scheme.source || 'Retrieved',
  }));
};

export const sendMessage = async (text, profile) => {
  try {
    // Build request payload
    const payload = {
      query: text,
      profile: profile || {},
    };

    // Call backend chat endpoint
    const response = await apiClient.post('/chat', payload);

    // Transform and return response
    return {
      text: response.data.text,
      schemes: transformSchemeResponse(response.data.schemes || []),
      intent: response.data.intent,
      session_id: response.data.session_id,
    };
  } catch (error) {
    console.error('API Error:', error.message);
    throw new Error(
      error.response?.data?.detail || 'Failed to fetch schemes. Please check if the backend is running.'
    );
  }
};

export const updateProfile = async (profileData) => {
  try {
    const payload = {
      profile: profileData || {},
    };

    const response = await apiClient.post('/profile', payload);

    return {
      user_id: response.data.user_id,
      profile: response.data.profile,
      saved: response.data.saved,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Profile Update Error:', error.message);
    throw new Error('Failed to save profile.');
  }
};

export const getMissedBenefits = async (profileData) => {
  try {
    const response = await apiClient.post('/missed', profileData || {});

    return {
      missed_schemes: transformSchemeResponse(response.data.missed_schemes || []),
      count: response.data.count || 0,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Missed Benefits Error:', error.message);
    throw new Error('Failed to fetch missed benefits.');
  }
};
