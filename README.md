# scheme-navigator-ai
Bharat policy Copilot

```text
policygpt-bharat/
├── README.md
├── requirements.txt
├── .env
│
├── backend/
│   ├── main.py                # FastAPI entry
│   ├── routes/
│   │   ├── chat.py
│   │   ├── user.py
│   │
│   ├── agents/
│   │   ├── query_agent.py
│   │   ├── rag_agent.py
│   │   ├── eligibility_agent.py
│   │   ├── compliance_agent.py
│   │   ├── action_agent.py
│   │   ├── alert_agent.py
│   │
│   ├── services/
│   │   ├── embedding.py
│   │   ├── vector_store.py
│   │   ├── llm.py
│   │
│   ├── utils/
│   │   ├── parser.py
│   │   ├── chunking.py
│   │
│   ├── data/
│   │   ├── raw_docs/
│   │   ├── processed_chunks/
│   │
│   └── config/
│       ├── settings.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBox.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── VoiceInput.jsx
│   │   │   ├── SchemeCard.jsx
│   │   │   ├── ProfileForm.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │
│   └── package.json
│
├── scripts/
│   ├── ingest_data.py
│   ├── build_index.py
│
├── demo/
│   ├── demo_script.md
│   ├── screenshots/
│
└── docs/
    ├── architecture.md
    ├── impact_model.md