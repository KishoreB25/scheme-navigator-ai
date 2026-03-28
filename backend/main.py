"""
PolicyGPT Bharat - FastAPI Backend
AI-powered Government Scheme Advisory System

Architecture: User → API → Orchestrator → Agents → Vector DB → Response
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, List
import uuid

from config.settings import settings
from orchestrator import PipelineOrchestrator


# ============= Pydantic Models =============


class UserProfile(BaseModel):
    age: Optional[int] = None
    income: Optional[int] = None
    state: Optional[str] = None
    occupation: Optional[str] = None
    gender: Optional[str] = None
    education: Optional[str] = None
    caste: Optional[str] = None


class ChatRequest(BaseModel):
    query: str
    profile: Optional[UserProfile] = None


class ProfileRequest(BaseModel):
    profile: UserProfile


class ChatResponse(BaseModel):
    text: str
    schemes: List[Dict]
    intent: str
    session_id: str
    eligible_count: int
    total_schemes: int
    compliance_verified: bool


# ============= FastAPI App =============

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=(
        "PolicyGPT Bharat – AI Government Scheme Advisor. "
        "Uses multi-agent RAG pipeline with compliance guardrails "
        "to provide accurate, source-backed scheme information."
    ),
)

# ============= CORS =============
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= Orchestrator =============
orchestrator = PipelineOrchestrator()


# ============= Startup Event =============


@app.on_event("startup")
async def startup_event():
    """Initialize vector store and agents on startup."""
    print("🚀 PolicyGPT Bharat starting up...")
    try:
        orchestrator.initialize()
        status = orchestrator.vector_store_status
        print(f"✅ Vector DB: {status['total_chunks']} chunks, {status['total_schemes']} schemes")
        print("✅ All agents initialized successfully")
    except Exception as e:
        print(f"⚠️ Startup warning: {e}")
        print("   System will try lazy initialization on first request")


# ============= Routes =============


@app.get("/")
async def root():
    """Health check endpoint with system status."""
    try:
        status = orchestrator.vector_store_status
    except Exception:
        status = {"initialized": False, "total_schemes": 0, "total_chunks": 0}

    return {
        "message": "PolicyGPT Bharat API is running",
        "version": settings.api_version,
        "status": "active",
        "system": {
            "agents": [
                "Query Understanding Agent",
                "RAG Retrieval Agent",
                "Eligibility Agent",
                "Compliance Guardrail Agent",
                "Action Agent",
                "Alert Agent",
            ],
            "vector_db": status,
            "pipeline": "query → query_agent → rag_agent → eligibility_agent → guardrail → action_agent → response",
        },
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint.
    Pipeline: Query Agent → RAG Agent → Eligibility Agent → Compliance Agent → Action Agent → Response
    """
    try:
        session_id = str(uuid.uuid4())
        profile_dict = request.profile.model_dump(exclude_none=True) if request.profile else {}

        # Run the full pipeline
        result = orchestrator.run_pipeline(request.query, profile_dict)

        return ChatResponse(
            text=result["response_text"],
            schemes=result["schemes"],
            intent=result["intent"],
            session_id=session_id,
            eligible_count=result["eligible_count"],
            total_schemes=result["total_schemes"],
            compliance_verified=result["compliance_verified"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profile")
async def update_profile(request: ProfileRequest):
    """Save/update user profile for personalized recommendations."""
    try:
        user_id = str(uuid.uuid4())
        profile_dict = request.profile.model_dump(exclude_none=True)

        result = orchestrator.alert_agent.save_profile(user_id, profile_dict)

        return {
            "user_id": user_id,
            "profile": result["profile"],
            "saved": True,
            "message": "Profile saved successfully",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/schemes")
async def get_all_schemes():
    """Get all available schemes in the database."""
    try:
        schemes = orchestrator.schemes_db
        return {
            "schemes": [
                {
                    "scheme_id": s.get("scheme_id"),
                    "scheme_name": s.get("scheme_name"),
                    "category": s.get("category"),
                    "description": s.get("description", "")[:200] + "...",
                    "state": s.get("state"),
                    "official_link": s.get("official_link"),
                }
                for s in schemes
            ],
            "total": len(schemes),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/missed")
async def get_missed_benefits_get(
    age: Optional[int] = Query(None),
    income: Optional[int] = Query(None),
    state: Optional[str] = Query(None),
    occupation: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    education: Optional[str] = Query(None),
    caste: Optional[str] = Query(None),
):
    """
    Missed Benefits Detector (GET).
    Scans all schemes to find benefits the user qualifies for but hasn't asked about.
    """
    try:
        profile_dict = {
            k: v for k, v in {
                "age": age, "income": income, "state": state,
                "occupation": occupation, "gender": gender,
                "education": education, "caste": caste,
            }.items() if v is not None
        }

        result = orchestrator.detect_missed_benefits(profile_dict)

        return {
            "missed_schemes": result["missed_schemes"],
            "count": result["count"],
            "message": result["message"],
            "profile_used": profile_dict,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/missed")
async def get_missed_benefits_post(request: UserProfile):
    """
    Missed Benefits Detector (POST).
    Scans all schemes to find benefits the user qualifies for but hasn't asked about.
    """
    try:
        profile_dict = request.model_dump(exclude_none=True)
        result = orchestrator.detect_missed_benefits(profile_dict)

        return {
            "missed_schemes": result["missed_schemes"],
            "count": result["count"],
            "message": result["message"],
            "profile_used": profile_dict,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/whatsapp")
async def whatsapp_webhook(message: Dict):
    """
    WhatsApp integration endpoint (Twilio/webhook).
    Accepts {"text": "...", "profile": {...}} and returns scheme info.
    """
    try:
        query = message.get("text", "")
        profile = message.get("profile", {})

        if not query:
            return {"whatsapp_response": "Please send a valid query about government schemes."}

        result = orchestrator.run_pipeline(query, profile)

        # Format for WhatsApp (text-only)
        wa_text = result["response_text"] + "\n\n"
        for scheme in result["schemes"][:3]:
            wa_text += f"📋 *{scheme.get('name', '')}*\n"
            wa_text += f"  Status: {scheme.get('eligibility_status', 'N/A')}\n"
            wa_text += f"  Link: {scheme.get('official_link', 'N/A')}\n\n"

        return {
            "whatsapp_response": wa_text,
            "schemes_count": result["total_schemes"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= Error Handlers =============


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
