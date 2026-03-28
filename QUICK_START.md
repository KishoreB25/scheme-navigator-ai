# 🚀 PolicyGPT Bharat - QUICK START (30 Seconds)

## ⚡ TL;DR - Run These 2 Commands

### Terminal 1: Start Backend
```bash
cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2: Start Frontend  
```bash
cd frontend && npm run dev
```

### Browser
Go to: **http://localhost:5173**

---

## ✅ What's Already Setup For You

- ✅ **Backend:** All 6 agents working, 23 schemes indexed, Groq LLM active
- ✅ **Frontend:** React components ready, API integration fixed
- ✅ **Database:** FAISS vector DB with 25 chunks pre-indexed
- ✅ **API Tests:** All 7 tests passing (100% success rate)

---

## 🎯 Try These Queries

**As a 30-year-old farmer from Maharashtra with ₹2.5L income:**

1. "What schemes am I eligible for?" → 4 schemes found
2. "Can I get PM-KISAN?" → YES + eligibility breakdown
3. "What about PMAY?" → Shows missed benefits
4. "Tell me about fake scheme XYZ" → Blocked (no hallucinations!)

---

## 📊 Live Backend Status

**Backend:** http://localhost:8000  
**Health Check:** http://localhost:8000/docs (Swagger UI)

```
✅ Groq LLM: llama-3.3-70b-versatile
✅ Vector DB: 25 chunks from 23 schemes  
✅ All Agents: Initialized (Query, RAG, Eligibility, Compliance, Action, Alert)
✅ APIs: 6 endpoints ready
✅ Tests: 7/7 passing
```

---

## 🎉 You're All Set!

The system is **fully integrated and tested**. Just run the two commands above and open the browser.

For detailed info: See `INTEGRATION_COMPLETE.md` or `INTEGRATION_TEST_GUIDE.md`

---

## 🆘 Quick Fixes

| Issue | Fix |
|-------|-----|
| ModuleNotFoundError | `pip install -r requirements.txt` |
| Port 8000 in use | Kill process or change port |
| Blank frontend | Clear browser cache |
| No backend connection | Ensure backend.running on 8000 |

---

**Status:** 🟢 Production Ready  
**Last Updated:** March 28, 2026
