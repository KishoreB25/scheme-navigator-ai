# PolicyGPT Bharat - QUICK START (30 Seconds)

## TL;DR - Run These 2 Commands

### Terminal 1: Start Backend
```bash
cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Terminal 2: Start Frontend  
```bash
cd frontend && npm run dev
```

### Browser
Go to: **http://localhost:5173**

---

## What's Already Setup For You

- **Backend:** All 6 agents working, Groq LLM active
- **Frontend:** React components ready, API integration fixed
- **Database:** ChromaDB vector DB auto-loads and auto-ingests only when empty
- **API Tests:** All 7 tests passing (100% success rate)

---

##  Try These Queries

**As a 30-year-old farmer from Maharashtra with ₹2.5L income:**

1. "What schemes am I eligible for?" → 4 schemes found
2. "Can I get PM-KISAN?" → YES + eligibility breakdown
3. "What about PMAY?" → Shows missed benefits
4. "Tell me about fake scheme XYZ" → Blocked (no hallucinations!)

---

##  Live Backend Status

**Backend:** http://localhost:8000  
**Health Check:** http://localhost:8000/  
**Swagger UI:** http://localhost:8000/docs

```
Groq LLM: llama-3.3-70b-versatile
Vector DB: ChromaDB persistent store  
All Agents: Initialized (Query, RAG, Eligibility, Compliance, Action, Alert)
APIs: 6 endpoints ready
Tests: 7/7 passing
```

---

## You're All Set!

The system is **fully integrated and tested**. Just run the two commands above and open the browser.

On first boot, the backend will automatically ingest scheme data only if ChromaDB is empty. After that, startup stays fast.

For detailed info: See `INTEGRATION_COMPLETE.md` or `INTEGRATION_TEST_GUIDE.md`

---

## Quick Fixes

| Issue | Fix |
|-------|-----|
| ModuleNotFoundError | `pip install -r requirements.txt` |
| Port 8000 in use | Kill process or change port |
| Blank frontend | Clear browser cache |
| No backend connection | Ensure backend is running on 8000 |
| Empty vector DB on first start | Let startup finish once; ingestion runs automatically |

---

**Status:** Production Ready  
**Last Updated:** June 2, 2026
