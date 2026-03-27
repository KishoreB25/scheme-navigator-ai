# 🧠 PolicyGPT Bharat – Model & AI System Design

## 🎯 Objective
Build a **domain-specialized AI agent system** for Indian government schemes with:
- Accurate retrieval (RAG)
- Eligibility reasoning
- Compliance guardrails
- Actionable outputs

---

# 🏗 SYSTEM OVERVIEW

User Query → Agent Orchestrator → Multi-Agent Pipeline → Response

### Core Stack
- Antigravity (Agent orchestration)
- FastAPI (Backend APIs)
- FAISS / Chroma (Vector DB)
- OpenAI / LLaMA / Mixtral (LLM)
- JSON / SQLite (Data store)

---

# 🔁 COMPLETE PIPELINE FLOW

```python
def run_pipeline(query, user_profile):
    intent, entities = query_agent(query)

    docs = rag_agent(query)

    eligibility = eligibility_agent(user_profile, docs)

    validated_response = compliance_guardrail_agent(docs)

    actions = action_agent(docs)

    return build_final_response(
        intent,
        docs,
        eligibility,
        validated_response,
        actions
    )
🤖 AGENT ARCHITECTURE
1. Query Understanding Agent
Role:

Extract intent + user entities

Output:
{
  "intent": "eligibility | search | apply",
  "entities": {
    "age": 30,
    "state": "Tamil Nadu",
    "income": 200000,
    "occupation": "farmer"
  }
}
2. RAG Retrieval Agent
Flow:
Embed user query
Search Vector DB
Return Top-K chunks
Tools:
SentenceTransformers / OpenAI embeddings
FAISS / Chroma
3. Eligibility Agent 🔥
Hybrid Logic:
Rule-based filtering
LLM reasoning
Example:
if user.age < scheme.min_age:
    return "Not Eligible"

if user.income < scheme.max_income:
    return "Eligible"
4. Compliance Guardrail Agent 🔥
CRITICAL COMPONENT
Ensures:
❌ No hallucinations
✅ Only retrieved context used
✅ Mandatory citations
Strategy:
Pass ONLY retrieved docs to LLM
Use strict system prompt
Reject unsupported answers
5. Action Agent
Outputs:
Application steps
Required documents
Official links
6. Alert Agent
Stores:
User profile
Preferences
Generates:
New scheme alerts
Personalized recommendations
📚 RAG SYSTEM DESIGN
Data Flow

Raw Data → Cleaning → Chunking → Embeddings → Vector DB

Chunking Strategy
Size: 300–500 tokens
Overlap: 50 tokens
Metadata:
{
  "scheme_name": "PMAY",
  "state": "India",
  "category": "housing"
}
Retrieval Pipeline
query → embedding → similarity search → top_k_docs → LLM
🗂 DATA INGESTION LAYER
Sources:
data.gov.in
pib.gov.in
Ministry websites
Scheme portals
Scraping Strategy
Step 1: Scrape HTML/PDF
BeautifulSoup (HTML)
PyPDF (PDF)
Step 2: Clean Data
Remove noise
Normalize text
Step 3: Convert to JSON
{
  "scheme_name": "",
  "description": "",
  "eligibility": "",
  "benefits": "",
  "documents_required": "",
  "application_process": "",
  "official_link": ""
}
Step 4: Chunk + Embed
🧠 SYSTEM PROMPT (MASTER CONTROL)
You are PolicyGPT Bharat, a government scheme expert AI.

STRICT RULES:
1. Use ONLY the provided context.
2. Do NOT hallucinate.
3. If information is missing, say:
   "This information is not available in the retrieved data."
4. Always provide:
   - Scheme name
   - Eligibility
   - Benefits
   - Application steps
   - Required documents
5. Add citations from retrieved sources.
6. Be clear, structured, and concise.
7. Prefer bullet points over paragraphs.
🧪 MISSED BENEFITS DETECTOR 🔥
def detect_missed(user_profile):
    all_schemes = load_all_schemes()

    eligible = [
        scheme for scheme in all_schemes
        if check_eligibility(user_profile, scheme)
    ]

    return rank_by_relevance(eligible)
📡 FASTAPI ENDPOINTS
1. Chat

POST /chat

2. User Profile

POST /profile

3. Missed Schemes

GET /missed

4. WhatsApp Webhook

POST /whatsapp

📊 ARCHITECTURE DIAGRAM (LOGIC)

User
↓
Frontend (React)
↓
FastAPI
↓
Agent Orchestrator
↓
Agents (Query → RAG → Eligibility → Guardrail → Action)
↓
Vector DB
↓
LLM