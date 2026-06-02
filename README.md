# 🚀 Scheme Navigator AI

![Scheme Navigator](https://img.shields.io/badge/Scheme-Navigator-0F172A?style=for-the-badge&logo=vercel&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLM-FF6B6B?style=for-the-badge&logo=groq&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector-F59E0B?style=for-the-badge&logo=database&logoColor=white)

**Scheme Navigator AI** is an intelligent government scheme advisory platform powered by multi-agent AI. It analyzes user profiles, intelligently matches them to eligible schemes, identifies missed benefits, and provides actionable guidance for scheme applications.

- **Live App:** [scheme-navigator-ai.vercel.app](https://scheme-navigator-ai.vercel.app/)

---

## 🛠️ Tech Stack

**Languages**  
`Python 3.10+` `JavaScript`

**Frameworks & UI**  
`React 19` `FastAPI` `Vite` `TailwindCSS`

**Databases & Search**  
`MongoDB` `ChromaDB` `Vector Embeddings`

**Services & AI**  
`Groq LLM` `Firebase Auth` `Axios`

---

## ✨ Key Features

### 🤖 **1. Multi-Agent AI System**
- **Query Agent:** Understands user intent and extracts demographic information (age, income, location, sector)
- **RAG Agent:** Retrieves relevant government schemes from vector database with semantic search
- **Eligibility Agent:** Validates scheme eligibility based on government criteria and user profile
- **Compliance Agent:** Ensures accurate, hallucination-free responses with government policy validation
- **Action Agent:** Provides step-by-step application guidance for scheme enrollment
- **Alert Agent:** Tracks user profile and alerts on new scheme eligibility

### 🎯 **2. Scheme Discovery & Matching**
- **Intelligent Matching:** Semantic matching of user profiles to government schemes
- **23+ Schemes Indexed:** Complete database of Indian government welfare schemes
- **Multi-Criteria Filtering:** Income levels, age groups, occupation, region-specific eligibility
- **Missed Benefits Identification:** Highlights schemes user qualifies for but hasn't applied
- **Real-time Eligibility Check:** Instant validation against scheme criteria
- **Ranking Algorithm:** Prioritizes schemes by relevance and applicability

### 👤 **3. Smart User Profiling**
- **Profile Creation:** Capture income, age, occupation, state, and family details
- **Dynamic Classification:** Automatically categorize users (farmer, student, elderly, entrepreneur)
- **Profile Updates:** Track eligibility changes as user profile evolves
- **Secure Storage:** Firebase authentication + MongoDB persistence
- **WhatsApp Integration:** Receive scheme alerts on WhatsApp

### 📊 **4. Application Tracking Dashboard**
- **Eligibility Summary:** View all schemes user qualifies for
- **Application Status:** Track submitted applications
- **Benefit Status:** Monitor active benefits and payments
- **Eligibility Timeline:** See when new schemes become available
- **Alerts Panel:** Real-time notifications for new opportunities

### 🗣️ **5. Voice-Enabled Interaction**
- **Voice Input:** Speak queries in natural language
- **Voice Output:** Listen to scheme details and application steps
- **Multi-Language Ready:** Foundation for Hindi, Tamil, Kannada, Bengali support
- **Accessibility:** Helps illiterate and elderly users navigate schemes

### 📱 **6. Responsive Mobile-First Design**
- **Mobile Optimized:** Works seamlessly on phones, tablets, desktops
- **Offline Capable:** Core functionality works without internet
- **Touch-Friendly:** Large buttons and swipe navigation
- **Dark Mode Ready:** Eye-friendly interface for long sessions
- **Progressive Enhancement:** Graceful degradation for older devices

### 🔐 **7. Enterprise-Grade Security**
- **Firebase Auth:** Secure user authentication with MFA support
- **Data Privacy:** Encrypted user profiles and application data
- **Role-Based Access:** Admin dashboards and user restrictions
- **Audit Logging:** Track all user interactions for compliance
- **HTTPS Only:** Secure communication across all layers

### ⚡ **8. Performance Optimizations**
- **Vector Search:** Fast semantic matching with ChromaDB
- **Keyword Fallback:** Ensures results even with vector search misses
- **Response Caching:** Frequently accessed schemes cached in-memory
- **Lazy Loading:** Progressive loading of scheme details
- **Optimized Embeddings:** 25 pre-computed embeddings for instant search

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                        │
│          (React 19 + Vite on Development)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • User Login & Authentication                       │   │
│  │  • Profile Creation & Management                     │   │
│  │  • Chat Interface with Voice I/O                     │   │
│  │  • Scheme Discovery Dashboard                        │   │
│  │  • Eligibility & Application Tracking                │   │
│  │  • Alerts & Notifications                            │   │
│  │  • WhatsApp Integration                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                    ↓ (Axios REST)                           │
├─────────────────────────────────────────────────────────────┤
│                   API GATEWAY LAYER                         │
│           (FastAPI + Python on Port 8000)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes:                                             │   │
│  │  • POST /chat - Query processing with agents         │   │
│  │  • POST /eligibility - Scheme eligibility check      │   │
│  │  • POST /profile - User profile management           │   │
│  │  • GET /schemes - Scheme browsing & filtering        │   │
│  │  • POST /apply - Application submission              │   │
│  │  • GET /alerts - Alert management                    │   │
│  │                                                      │   │
│  │  Middleware:                                         │   │
│  │  • Firebase authentication                           │   │
│  │  • CORS protection                                   │   │
│  │  • Request validation & logging                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                ↓ (Python)       ↓ (HTTP)                    │
├─────────────────────────────────────────────────────────────┤
│           AI AGENTS LAYER         │   DATA LAYER            │
│       (Multi-Agent Orchestration) │ (Persistence & Search)  │
│ ┌─────────────────────────────┐   │ ┌─────────────────────┐ │
│ │ 1. Query Agent              │   │ │ MongoDB:            │ │
│ │    • Intent extraction      │   │ │  • Users            │ │
│ │    • Entity recognition     │   │ │  • Profiles         │ │
│ │                             │   │ │  • Applications     │ │
│ │ 2. RAG Agent                │   │ │  • Scheme data      │ │
│ │    • Vector search          │   │ │                     │ │
│ │    • Semantic matching      │   │ │ ChromaDB:           │ │
│ │    • Fallback keyword       │   │ │  • Embeddings       │ │
│ │                             │   │ │  • Vector index     │ │
│ │ 3. Eligibility Agent        │   │ │                     │ │
│ │    • Rule-based logic       │   │ │ Firebase:           │ │
│ │    • Criteria validation    │   │ │  • Auth tokens      │ │
│ │    • Score calculation      │   │ │  • User sessions    │ │
│ │                             │   │ └─────────────────────┘ │
│ │ 4. Compliance Agent         │   │                         │
│ │    • Response validation    │   │                         │
│ │    • Hallucination blocking │   │                         │
│ │    • Source citation        │   │                         │
│ │                             │   │                         │
│ │ 5. Action Agent             │   │                         │
│ │    • Step generation        │   │                         │
│ │    • Document requirements  │   │                         │
│ │    • Timeline estimation    │   │                         │
│ │                             │   │                         │
│ │ 6. Alert Agent              │   │                         │
│ │    • Profile monitoring     │   │                         │
│ │    • Eligibility tracking   │   │                         │
│ │    • Notification creation  │   │                         │
│ │                             │   │                         │
│ │  ↓ (Groq LLM API)           │   │                         │
│ │  Groq (llama-3.3-70b)       │   │                         │
│ └─────────────────────────────┘   │                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Complete Setup Guide

### **Step 1: Clone Repository**

```bash
git clone https://github.com/your-repo/scheme-navigator-ai.git
cd scheme-navigator-ai
```

### **Step 2: Environment Configuration**

Create the backend environment file at `backend/.env`.
The backend loads environment variables from this file automatically.

You can use `backend/.env.example` as a template and fill in your values:

```bash
# HuggingFace
HF_TOKEN=your_huggingface_token

# LLM / Embeddings
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=
GOOGLE_API_KEY=your_google_api_key

# Database
MONGODB_URL=your_mongodb_connection_string
MONGODB_DB_NAME=policygpt_bharat

# API Configuration
DEBUG=true
BACKEND_URL=http://localhost:8000
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","*"]

# ChromaDB Vector Store
CHROMA_PERSIST_DIR=data/chroma_db
CHROMA_COLLECTION_NAME=bharat_policies

# Firebase Credentials
# Paste the Firebase service-account JSON as a single line string
FIREBASE_CREDENTIALS_JSON={...}
```

Notes:

- Keep `backend/.env` out of version control.
- Use `backend/.env.example` for a shareable template.
- On Render, add the same variables in the service environment settings.

### **Step 3: Install Dependencies**

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### **Step 4: Start Services (3 Terminals)**

**Terminal 1: Backend API**
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
# Runs on http://localhost:8000
# Swagger UI: http://localhost:8000/docs
```

**Terminal 2: Frontend Application**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Terminal 3: Run Tests (Optional)**
```bash
cd backend
python test_api.py
```

**Open Browser:** [http://localhost:5173](http://localhost:5173)

---

## 📖 Usage Examples

### **Example 1: Profile-Based Scheme Discovery**
```
User: "I'm a 32-year-old farmer from Maharashtra with ₹2.5L annual income"
System: 
  Identified as: Farmer, Below middle income
  Found 12 eligible schemes
  Top 3: PM-KISAN, PMAY, Pradhan Mantri Yojana
```

### **Example 2: Direct Eligibility Check**
```
User: "Am I eligible for PM-KISAN?"
System:
  YES - You qualify!
  Monthly benefit: ₹500-1000
  Application deadline: Open
  Next steps: Upload land documents
```

### **Example 3: Missed Benefits Alert**
```
User: "Show me schemes I might have missed"
System:
  Missed 3 schemes!
  • Pradhan Mantri Gramin Awas Yojana (Housing)
  • PM-WANI (Internet access)
  • State-specific agriculture subsidies
```

---

## 🧪 Testing

```bash
# Run all tests
cd backend
python test_api.py

# Expected Output:
# Test 1: Query intent extraction - PASSED
# Test 2: RAG scheme retrieval - PASSED
# Test 3: Eligibility validation - PASSED
# Test 4: Compliance check - PASSED
# Test 5: Action guidance - PASSED
# Test 6: Alert generation - PASSED
# Test 7: End-to-end chat - PASSED
# 
# Result: 7/7 PASSED (100%)
```

---

## 📁 Project Structure

```
scheme-navigator-ai/
├── backend/
│   ├── main.py                    # FastAPI server
│   ├── orchestrator.py            # Agent coordination
│   ├── agents/
│   │   ├── query_agent.py         # Intent extraction
│   │   ├── rag_agent.py           # Scheme retrieval
│   │   ├── eligibility_agent.py   # Eligibility check
│   │   ├── compliance_agent.py    # Response validation
│   │   ├── action_agent.py        # Application steps
│   │   └── alert_agent.py         # Profile management
│   ├── config/
│   │   ├── settings.py            # Configuration
│   │   └── prompts.py             # Agent prompts
│   ├── data/
│   │   ├── schemes_data.json      # Scheme database
│   │   └── chroma_db/             # Vector embeddings
│   ├── services/
│   │   ├── llm_service.py         # Groq LLM interface
│   │   ├── firebase_service.py    # Authentication
│   │   └── database.py            # Data persistence
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx     # Main chat UI
│   │   │   ├── ProfileForm.jsx       # User profiles
│   │   │   ├── SchemeCard.jsx        # Scheme display
│   │   │   ├── VoiceInputButton.jsx  # Voice input
│   │   │   ├── MissedBenefitsPanel.jsx
│   │   │   ├── AlertsPanel.jsx       # Notifications
│   │   │   └── MessageBubble.jsx
│   │   ├── hooks/
│   │   │   ├── useChat.js
│   │   │   ├── useProfile.js
│   │   │   └── useSpeechRecognition.js
│   │   ├── services/
│   │   │   ├── api.js               # Backend API client
│   │   │   └── voiceService.js      # Voice processing
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── AlertsPage.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── README.md                     # This file
├── QUICK_START.md               # 30-second setup
└── requirements.txt
```

---

## 🔄 Data Flow Pipelines

**Chat Query**: User → Query Agent (intent extraction) → RAG Agent (semantic search) → Eligibility Agent (criteria check) → Compliance Agent (validation) → Response

**User Profile**: Profile Form → Firebase/MongoDB → Alert Agent (scheme matching) → Notifications (in-app/email/WhatsApp)

**Application Help**: User Query → Action Agent (step-by-step guide) → Document templates + FAQ → Formatted response

---

## 🌟 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/chat` | Process user query through agent pipeline |
| `POST` | `/eligibility` | Check scheme eligibility for user |
| `POST` | `/profile` | Create/update user profile |
| `GET` | `/schemes` | Browse all indexed schemes |
| `POST` | `/apply` | Submit scheme application |
| `GET` | `/alerts` | Fetch user alerts & notifications |
| `POST` | `/voice` | Process voice input |

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

## 📊 Data Ingestion

Load scheme data into ChromaDB for semantic search:
```bash
python -m backend.data.ingestion add       # Add schemes to ChromaDB
python -m backend.data.ingestion list      # List indexed schemes
python -m backend.data.ingestion reset     # Clear database
```

---

## 🧪 Testing

### Run All Tests
```bash
python test_api.py
```

### Manual Testing
1. Open `http://localhost:5173` in browser
2. Fill profile (age, state, occupation)
3. Send message: "I am a farmer from Maharashtra"
4. Verify schemes appear with details
5. Test voice input
6. Check missed benefits section

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
  Agents            Database (ChromaDB + JSON)
  1. Query          23 Government Schemes
    2. RAG (ChromaDB)  User Profiles (MongoDB)
  3. Eligibility    
  4. Compliance
  5. LLM Service (Groq Llama-3.3)
  6. Action
  7. Alert (Missed Benefits)
```

## 📈 Performance

- **API Response Time**: <2 seconds 
- **Frontend Load**: <1 second 
- **Memory Usage**: <500MB

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built for Economic Times GenAI Hackathon
- Government scheme data from official sources
- LLM powered by Groq
- Vector embeddings with ChromaDB

