import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Default FastAPI port

// Helper to simulate delay for mock responses
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const sendMessage = async (text, profile) => {
  try {
    // Attempt to hit the real backend first
    const response = await axios.post(`${API_BASE_URL}/chat`, { query: text, profile });
    return response.data;
  } catch (error) {
    console.warn("Backend not available, using mock response for demo.");
    await delay(1500); // Simulate network latency

    // MOCK RESPONSE
    if (text.toLowerCase().includes('farmer')) {
      return {
        text: "Based on your profile as a farmer from Maharashtra, I've found a few schemes you are highly eligible for. Here are the details:",
        schemes: [
          {
            name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
            eligibility_status: true,
            description: "An initiative by the government of India in which all farmers will get up to ₹6,000 per year as minimum income support.",
            benefits: [
              "₹6,000 per year income support",
              "Direct benefit transfer (DBT) to bank account",
              "Financial independence for crop procurement"
            ],
            steps: "Visit pmkisan.gov.in -> Click on 'New Farmer Registration' -> Enter Aadhaar and fill the form."
          },
          {
            name: "MahaDBT Farmer Scheme",
            eligibility_status: true,
            description: "A centralized portal by the Maharashtra Government for various farmer welfare programs, equipment subsidies, and irrigation facilities.",
            benefits: [
              "Subsidies on agricultural equipment",
              "Financial assistance for drip irrigation",
              "Subsidized high-quality seeds"
            ],
            steps: "Register on mahadbtmahait.gov.in -> Create a profile -> Apply under 'Agriculture Department' schemes."
          }
        ]
      };
    }

    return {
      text: "I understand. Could you provide a bit more detail about your occupation or requirements so I can find the perfect government schemes for you?",
      schemes: []
    };
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/profile`, profileData);
    return response.data;
  } catch (error) {
    console.warn("Backend not available, using mock for profile update.");
    await delay(800);
    return { success: true, message: "Profile saved locally for session." };
  }
};

export const getMissedBenefits = async (profileData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/missed`, profileData);
    return response.data;
  } catch (error) {
    console.warn("Backend not available, using mock for missed benefits.");
    await delay(2000);
    return {
      missed_schemes: [
        {
          name: "Ayushman Bharat PM-JAY",
          eligibility_status: true,
          description: "A health insurance scheme offering Rs. 5 Lakh cover per family per year.",
          benefits: ["Free treatment at empanelled hospitals", "Covers pre and post hospitalization expenses", "No cap on family size"],
          steps: "Check eligibility using your mobile or ration card number on mera.pmjay.gov.in and visit nearest CSC or empanelled hospital for e-card."
        }
      ]
    };
  }
};
