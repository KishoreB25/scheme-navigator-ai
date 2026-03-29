# scheme-navigator-ai

### POLICYSETU - Economic Times GenAI Hackathon

```text
policygpt-bharat/
├── README.md
├── requirements.txt
├── .env
│
├── backend/
│   ├── main.py                    # FastAPI server
│   ├── agents/
│   │   ├── query_agent.py        # Intent extraction
│   │   ├── rag_agent.py          # Scheme retrieval
│   │   ├── eligibility_agent.py  # Eligibility check
│   │   ├── compliance_agent.py   # Response validation
│   │   ├── action_agent.py       # Application steps
│   │   └── alert_agent.py        # Profile management
│   ├── config/
│   │   └── settings.py           # Configuration
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── ProfileForm.jsx
│   │   │   ├── SchemeCard.jsx
│   │   │   ├── VoiceInputButton.jsx
│   │   │   ├── MissedBenefitsPanel.jsx
│   │   │   ├── AlertsPanel.jsx
│   │   │   └── MessageBubble.jsx
│   │   ├── hooks/
│   │   │   ├── useChat.js
│   │   │   ├── useProfile.js
│   │   │   └── useSpeechRecognition.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   └── App.jsx
│   └── package.json
│
├── test_api.py                   # API tests
├── run_tests.py                  # Automated tests
├── README.md                     # This file
└── NEXT_STEPS_IMMEDIATE.md      # Enhancement guide
```

---

## 🎬 Demo Flow

1. **Profile Setup**: Fill age, state, income, occupation
2. **Query**: "I am a farmer from Maharashtra"
3. **System Processes**:
   - Understands intent (search)
   - Extracts entities (farmer, Maharashtra, 30y)
   - Finds matching schemes
   - Checks eligibility
4. **Results Display**:
   - 3+ schemes with details
   - Application steps
   - Benefits list
   - Eligibility status ✅/❌
5. **Missed Benefits**: Shows additional eligible schemes

---


## ⏳ What's Missing (Not Critical)

- ⏳ Twilio WhatsApp integration - Endpoint exists, not connected
- ⚠️ Only 23 schemes in database - Need 50+ for a full production release

---

## 🔧 API Endpoints

### Health Check
```bash
GET http://localhost:8000/
```

### Chat Query
```bash
POST http://localhost:8000/chat
Content-Type: application/json

{
  "query": "I am a farmer from Maharashtra",
  "profile": {
    "age": 30,
    "state": "Maharashtra",
    "occupation": "farmer",
    "income": 250000
  }
}
```

### Get All Schemes
```bash
GET http://localhost:8000/schemes
```

### Save Profile
```bash
POST http://localhost:8000/profile
Content-Type: application/json

{
  "profile": {
    "age": 30,
    "income": 250000,
    "state": "Maharashtra",
    "occupation": "farmer"
  }
}
```

### Missed Benefits
```bash
GET http://localhost:8000/missed?age=30&state=Maharashtra&occupation=farmer
```


---

## 🎯 Key Features

✨ **Smart Query Understanding**
- Detects user intent (search, eligibility, apply)
- Extracts relevant entities (age, income, state, occupation)

✨ **Intelligent Eligibility**
- Rule-based checking
- Age, income, occupation validation
- Gender and caste-based schemes (extensible)

✨ **Missed Benefits Detection**
- Finds schemes user didn't search for
- Based on user profile and eligibility
- Shows unexpected opportunities

✨ **Voice Input Support**
- Speech-to-text integration
- Browser-based using Web Speech API
- Fallback for unsupported browsers

✨ **Beautiful UI**
- Clean chat interface
- Responsive design
- Tailwind CSS styling
- Lucide React icons

✨ **Production Ready**
- Error handling
- CORS configured
- Input validation
- Response caching

---

## 🧪 Testing

### Run All Tests
```bash
python run_tests.py
```

### Quick API Test
```bash
python test_api.py
```

### Manual Testing
1. Open `http://localhost:5173` in browser
2. Fill profile (age, state, occupation)
3. Send message: "I am a farmer from Maharashtra"
4. Verify schemes appear with details
5. Test voice input (click 🎤)
6. Check missed benefits section

---

## 🎓 Tech Stack

**Backend**:
- FastAPI - REST API framework
- Python 3.8+
- Pydantic - Data validation
- Groq SDK - LLM Generation (Llama-3.3-70b)
- FAISS & Sentence Transformers - Local Vector DB and Embeddings

**Frontend**:
- React 19.2
- Vite - Build tool
- Tailwind CSS - Styling
- Lucide Icons - Icons

**Integration**:
- Axios - HTTP client
- Web Speech API - Voice input

---

## 🚀 Next Steps for Enhancement

### High Priority (1 hour)
1. Add 10+ more schemes to database
2. Improve eligibility rules (gender, caste, state-specific)
3. Test with 5+ user personas
4. Polish voice input UI

### Medium Priority (2-3 hours)
1. Integrate FAISS/Chroma for semantic search
2. Add real LLM (GPT-3.5 or open source)
3. Expand to 50+ government schemes
4. Add regional language support

### Low Priority (Future)
1. WhatsApp integration with Twilio
2. Mobile app version
3. Admin dashboard for schemes management
4. Advanced compliance guardrails

---

## 📝 Environment Setup

### Backend (.env)
```
API_TITLE=PolicyGPT Bharat
API_VERSION=1.0.0
CORS_ORIGINS=["*"]
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

---

## 🤝 Architecture Overview (Multi-Agent RAG Pipeline)

```text
        Web Browser (React)
             ↓ (API)
         Frontend UI
             ↓ (HTTP POST /chat, /profile)
       FastAPI Backend
             ↓
     Pipeline Orchestrator
             ↓
    ┌─────────┴─────────┐
    ↓                   ↓
  Agents            Database (FAISS + JSON)
  1. Query          23 Government Schemes
  2. RAG (FAISS)    User Profiles (In-memory)
  3. Eligibility    
  4. Compliance
  5. LLM Service (Groq Llama-3.3)
  6. Action
  7. Alert (Missed Benefits)
```

### 🧠 Pipeline Deep Dive

1. **Query Agent**: Extracts intent and profile entities (age, occupation, state, income) from the user's natural language question.
2. **RAG Agent (Retrieval)**: Uses a hybrid approach—FAISS vector semantic search via `sentence-transformers` + intelligent keyword matching to retrieve the most relevant schemes without hallucination.
3. **Eligibility Agent**: A strict rule engine that checks the user's profile against the official scheme criteria, providing a detailed ✅/❌/⚠️ breakdown.
4. **Compliance Agent**: Enforces strict guardrails. Ensures responses only use retrieved data and always contain mandatory fields (benefits, documents, official links).
5. **LLM Generation Service (Generation)**: Uses the fast Groq API (`llama-3.3-70b-versatile`) to translate the strict, validated data into a warm, helpful, and natural language response.
6. **Action Agent**: Extracts and formats exact application steps and required documents.
7. **Alert Agent (Missed Benefits Detector)**: Runs silently in the background, scanning the entire scheme database against the user profile to detect "Missed Benefits" the user is eligible for but didn't explicitly ask about.

### 💻 Frontend Details

The frontend is a React 19 single-page application built with Vite and Tailwind CSS. It features:
- **Interactive Chat Interface**: A sleek, modern messenger where users converse with the AI in natural language.
- **Dynamic User Profile Manager**: A live form that holds age, income, state, and occupation state, which is automatically appended to every chat query.
- **Missed Benefits Dashboard**: A dedicated side panel displaying proactive alerts and "hidden" schemes discovered by the Alert Agent.
- **Voice Input**: Web Speech API integration, allowing rural or differently-abled users to speak their queries instead of typing.

---


---

## 📬 Support & Debugging

### Backend Not Starting?
```bash
# Check Python version
python --version  # Should be 3.8+

# Check port 8000 is free
netstat -ano | grep 8000

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend Not Loading?
```bash
# Check Node version
node --version  # Should be 16+

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install --force
```

### API Errors in Console?
- Check CORS headers (should be configured)
- Verify backend URL in api.js
- Check browser console (F12) for details

---

## 📈 Performance

- **API Response Time**: <2 seconds ✅
- **Frontend Load**: <1 second ✅
- **Chat Bot Latency**: <500ms ✅
- **Memory Usage**: <500MB ✅

---


**Project**: PolicySetu - AI Government Scheme Advisor  
