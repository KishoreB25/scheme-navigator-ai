# PolicyGPT Bharat - Backend Setup

## Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Backend
```bash
# From the backend directory
python main.py
```

The API will be available at: `http://localhost:8000`

### 3. API Documentation
Once running, visit: `http://localhost:8000/docs` (Swagger UI)

---

## Backend Architecture

### Multi-Agent System

1. **Query Agent** - Extracts intent and entities from user queries
2. **RAG Agent** - Retrieves relevant schemes from knowledge base
3. **Eligibility Agent** - Checks user eligibility for schemes
4. **Compliance Agent** - Ensures responses use only retrieved data
5. **Action Agent** - Provides application steps
6. **Alert Agent** - Manages user profiles and alerts

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Health check |
| `/chat` | POST | Main chat interface |
| `/profile` | POST | Save user profile |
| `/schemes` | GET | Get all schemes |
| `/missed` | POST | Get missed benefits |
| `/whatsapp` | POST | WhatsApp integration |

### Request/Response Format

#### Chat Request
```json
{
  "query": "I am a 30-year-old farmer from Maharashtra",
  "profile": {
    "age": 30,
    "income": 250000,
    "state": "Maharashtra",
    "occupation": "farmer"
  }
}
```

#### Chat Response
```json
{
  "text": "Based on your profile...",
  "schemes": [
    {
      "id": 1,
      "name": "Scheme Name",
      "eligible": true,
      "description": "...",
      "benefits": [...],
      "steps": [...],
      "documents": [...]
    }
  ],
  "intent": "search",
  "session_id": "uuid"
}
```

---

## Features

✅ Query understanding and entity extraction
✅ Scheme retrieval and matching
✅ Eligibility checking with rule-based logic
✅ Compliance guardrails (citations, sourcing)
✅ Application step guidance
✅ Missed benefits detection
✅ User profile management
✅ WhatsApp integration ready

---

## Development

### Add More Schemes
Edit `backend/agents/rag_agent.py` and add to `STEPS_DB` dict

### Add Agent Logic
Each agent in `backend/agents/` can be extended with:
- LLM integration (OpenAI/Mixtral)
- Vector DB (FAISS/Chroma)
- Custom rules

---

## Testing

### Test Chat Endpoint
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"query":"schemes for farmer","profile":{"occupation":"farmer","state":"Maharashtra"}}'
```

### Test Profile
```bash
curl -X POST "http://localhost:8000/profile" \
  -H "Content-Type: application/json" \
  -d '{"profile":{"age":30,"occupation":"farmer"}}'
```

---

## Next Steps

1. **Vector DB Integration** - Replace mock RAG with real embeddings
2. **LLM Integration** - Add OpenAI/Mixtral for better responses
3. **Data Ingestion** - Load actual scheme data from PDFs
4. **WhatsApp Bot** - Setup Twilio integration
5. **Missed Benefits** - Fine-tune detection algorithm

---

## Environment Variables

Create a `.env` file:
```
DEBUG=True
BACKEND_URL=http://localhost:8000
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```
