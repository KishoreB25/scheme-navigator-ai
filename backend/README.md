# Backend Setup

See main [README.md](../README.md) for complete documentation.

## Quick Start

```bash
pip install -r requirements.txt
python main.py
```

API runs on: http://localhost:8000
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
