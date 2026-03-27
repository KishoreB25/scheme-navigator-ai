"""
PolicyGPT Bharat - FastAPI Backend
Government Scheme Advisory System
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, List
import uuid

from config.settings import settings
from agents import (
    QueryAgent,
    RAGAgent,
    EligibilityAgent,
    ComplianceAgent,
    ActionAgent,
    AlertAgent,
)

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


class SchemeDetail(BaseModel):
    id: int
    name: str
    description: str
    eligible: bool
    benefits: List[str]


class ChatResponse(BaseModel):
    text: str
    schemes: List[Dict]
    intent: str
    session_id: str


# ============= FastAPI App =============

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description="AI-powered Government Scheme Advisor",
)

# ============= CORS Configuration =============
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= Agent Initialization =============
query_agent = QueryAgent()
rag_agent = RAGAgent()
eligibility_agent = EligibilityAgent()
compliance_agent = ComplianceAgent()
action_agent = ActionAgent()
alert_agent = AlertAgent()

# ============= Routes =============


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "PolicyGPT Bharat API is running",
        "version": settings.api_version,
        "status": "active",
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint
    Flow: Query Agent → RAG Agent → Eligibility Agent → Compliance Agent
    """
    try:
        session_id = str(uuid.uuid4())
        profile_dict = request.profile.dict() if request.profile else {}

        # 1. Query Understanding Agent
        query_result = query_agent.process(request.query, profile_dict)
        intent = query_result["intent"]
        entities = query_result["entities"]

        # Merge profile with extracted entities
        merged_profile = {**profile_dict, **entities}

        # 2. RAG Retrieval Agent
        rag_result = rag_agent.process(request.query, entities)
        retrieved_schemes = rag_result["retrieved_schemes"]

        # 3. Eligibility Agent
        eligibility_result = eligibility_agent.process(
            retrieved_schemes, merged_profile
        )
        eligible_schemes = eligibility_result["eligible_schemes"]

        # 4. Compliance Agent
        compliance_result = compliance_agent.process(
            eligible_schemes, request.query, intent
        )

        # 5. (Optional) Action Agent for steps
        if intent == "apply" and eligible_schemes:
            action_result = action_agent.process(eligible_schemes)
            for i, scheme in enumerate(compliance_result["schemes"]):
                if i < len(action_result["actions"]):
                    scheme["steps"] = action_result["actions"][i]["application_steps"]
                    scheme["documents"] = action_result["actions"][i]["required_documents"]

        return ChatResponse(
            text=compliance_result["response_text"],
            schemes=compliance_result["schemes"],
            intent=intent,
            session_id=session_id,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profile")
async def update_profile(request: ProfileRequest):
    """
    Update user profile
    """
    try:
        user_id = str(uuid.uuid4())
        profile_dict = request.profile.dict()

        result = alert_agent.save_profile(user_id, profile_dict)

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
    """
    Get all available schemes
    """
    try:
        return {
            "schemes": rag_agent.schemes_db,
            "total": len(rag_agent.schemes_db),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/missed")
async def get_missed_benefits(request: UserProfile):
    """
    Get schemes user might have missed
    """
    try:
        profile_dict = request.dict()

        # Get all schemes
        all_schemes = rag_agent.schemes_db

        # Check eligibility for all
        eligibility_result = eligibility_agent.process(all_schemes, profile_dict)

        missed_schemes = eligibility_result["eligible_schemes"]

        return {
            "missed_schemes": missed_schemes,
            "count": len(missed_schemes),
            "message": f"You are eligible for {len(missed_schemes)} additional scheme(s) you might not be aware of!",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/whatsapp")
async def whatsapp_webhook(message: Dict):
    """
    WhatsApp integration endpoint (Twilio)
    """
    try:
        query = message.get("text", "")
        profile = message.get("profile", {})

        # Reuse chat logic
        chat_request = ChatRequest(query=query, profile=UserProfile(**profile))
        response = await chat(chat_request)

        return {
            "whatsapp_response": response.text,
            "schemes": response.schemes,
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
