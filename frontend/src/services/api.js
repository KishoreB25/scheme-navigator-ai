import axios from 'axios';

// Use environment variable if available, fallback to localhost for development
export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

console.log('API_BASE_URL:', API_BASE_URL); // Debug log

// Configure axios with reasonable timeout
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // increased for ChromaDB + embedding queries
});

// Transform backend response to frontend format
const transformSchemeResponse = (backendSchemes) => {
  return backendSchemes.map((scheme) => ({
    id: scheme.id || scheme.scheme_id || 'N/A',
    name: scheme.name || scheme.scheme_name || 'Unknown Scheme',
    description: scheme.description || '',
    category: scheme.category || '',
    eligible: scheme.eligible || false,
    eligibility_status: scheme.eligibility_status || (scheme.eligible ? 'Eligible ✅' : 'Not Eligible ❌'),
    eligibility_reasons: scheme.eligibility_reasons || [],
    eligibility_text: scheme.eligibility_text || scheme.eligibility || '',
    benefits: Array.isArray(scheme.benefits) ? scheme.benefits : (scheme.benefits ? [scheme.benefits] : []),
    documents_required: scheme.documents_required || scheme.required_documents || [],
    application_steps: scheme.application_steps || [],
    official_link: scheme.official_link || scheme.source || '',
    citation: scheme.citation || `Source: ${scheme.official_link || 'PolicyGPT Bharat Database'}`,
    relevance_score: scheme.relevance_score || 0,
  }));
};

export const sendMessage = async (text, profile, userId = null, sessionId = null) => {
  try {
    const payload = {
      query: text,
      profile: profile || {},
      user_id: userId,
      session_id: sessionId,
    };

    const response = await apiClient.post('/chat', payload);

    return {
      text: response.data.text,
      schemes: transformSchemeResponse(response.data.schemes || []),
      intent: response.data.intent,
      session_id: response.data.session_id,
      eligible_count: response.data.eligible_count,
      total_schemes: response.data.total_schemes,
      compliance_verified: response.data.compliance_verified,
    };
  } catch (error) {
    console.error('API Error:', error.message);
    throw new Error(
      error.response?.data?.detail || 'Failed to fetch schemes. Please check if the backend is running.'
    );
  }
};

export const getChatHistory = async (userId, sessionId = null, limit = 100) => {
  if (!userId) {
    return { user_id: null, session_id: null, messages: [], count: 0 };
  }

  try {
    const params = new URLSearchParams();
    if (sessionId) {
      params.set('session_id', sessionId);
    }
    params.set('limit', String(limit));

    const response = await apiClient.get(`/chat/history/${userId}?${params.toString()}`);

    return {
      user_id: response.data.user_id,
      session_id: response.data.session_id,
      messages: response.data.messages || [],
      count: response.data.count || 0,
    };
  } catch (error) {
    console.error('Chat History Error:', error.message);
    throw new Error('Failed to load chat history.');
  }
};

export const updateProfile = async (firebaseUid, profileData) => {
  try {
    // Filter out empty fields - especially important for gender
    const cleanedProfile = Object.fromEntries(
      Object.entries(profileData).filter(
        ([_, value]) => value !== '' && value !== null && value !== undefined
      )
    );

    const payload = {
      firebase_uid: firebaseUid,
      profile: cleanedProfile || {},
    };

    const response = await apiClient.post('/profile', payload);

    return {
      firebase_uid: response.data.firebase_uid,
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

export const getAllSchemes = async () => {
  try {
    const response = await apiClient.get('/schemes');
    return {
      schemes: response.data.schemes || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    console.error('Schemes Error:', error.message);
    throw new Error('Failed to fetch schemes.');
  }
};

// Export alias for backward compatibility
export const saveProfile = updateProfile;
