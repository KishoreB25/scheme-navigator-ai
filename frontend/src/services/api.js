import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // FastAPI backend

// Configure axios with reasonable timeout
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // increased for FAISS + embedding queries
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

export const sendMessage = async (text, profile) => {
  try {
    const payload = {
      query: text,
      profile: profile || {},
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
