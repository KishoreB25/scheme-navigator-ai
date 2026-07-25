"""
PolicyGPT Bharat - FastAPI Backend
AI-powered Government Scheme Advisory System

Architecture: User → API → Orchestrator → Agents → Vector DB → Response
"""

from fastapi import FastAPI, HTTPException, Query, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, List
import os
import uuid

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    SLOWAPI_AVAILABLE = True
except ImportError:
    SLOWAPI_AVAILABLE = False
    print("[Security] slowapi not installed — rate limiting disabled. Run: pip install slowapi")

from config.settings import settings
from orchestrator import PipelineOrchestrator
from data.ingestion import ChromaVectorStore, SchemeIngester
from services.database import db_service
from services.firebase_service import FirebaseService
from services.freshness_checker import FreshnessChecker
from services.whatsapp_service import WhatsAppService
from middleware import (
    sanitize_input,
    RequestLoggingMiddleware,
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
    # Note: name is stored at top level, not in profile


class ChatRequest(BaseModel):
    query: str
    profile: Optional[UserProfile] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    language: Optional[str] = "en"


class ProfileRequest(BaseModel):
    profile: UserProfile


class ProfileUpdateRequest(BaseModel):
    firebase_uid: str
    profile: UserProfile


class GuestProfileRequest(BaseModel):
    """Create temporary guest profile without authentication"""
    name: str
    profile: UserProfile


class ChatResponse(BaseModel):
    text: str
    schemes: List[Dict]
    intent: str
    session_id: str
    eligible_count: int
    total_schemes: int
    compliance_verified: bool
    response_type: str = "scheme_results"  # "conversational" | "scheme_results"


# ============= Firebase Auth Models =============


class FirebaseAuthRequest(BaseModel):
    token: str  # Firebase ID token from client
    guest_firebase_uid: Optional[str] = None  # If user was guest, provide the guest UID for merge


class UserData(BaseModel):
    uid: str
    email: str
    name: Optional[str] = None
    email_verified: Optional[bool] = False
    picture: Optional[str] = None
    profileCompleted: Optional[bool] = False
    profile: Optional[Dict] = None
    isGuest: Optional[bool] = False


class AlertSubscribeRequest(BaseModel):
    phone: str
    user_id: Optional[str] = None
    alert_types: List[str] = []


class AlertSendRequest(BaseModel):
    user_id: str
    scheme_id: str
    alert_type: str


class AuthResponse(BaseModel):
    user: UserData
    message: str
    isNewUser: bool


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

# ============= Rate Limiting =============
if SLOWAPI_AVAILABLE:
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
else:
    limiter = None

# ============= Middleware =============
# Request logging
app.add_middleware(RequestLoggingMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= Orchestrator =============
orchestrator = PipelineOrchestrator()

# ============= Firebase Service =============
firebase_service = FirebaseService()

# ============= Freshness Checker =============
freshness_checker = FreshnessChecker(db_service=db_service)

# ============= WhatsApp Service =============
whatsapp_service = WhatsAppService()


def _chroma_persist_dir() -> str:
    """Return the on-disk ChromaDB directory used by the backend."""
    return os.path.join(os.path.dirname(__file__), "data", "chroma_db")


def _vector_db_has_data() -> bool:
    """Check whether ChromaDB already contains indexed scheme data."""
    try:
        vector_store = ChromaVectorStore(persist_dir=_chroma_persist_dir())
        return vector_store.has_data
    except Exception as e:
        print(f"[WARNING] Vector DB preflight failed: {e}")
        return False


# ============= Startup Event =============


@app.on_event("startup")
async def startup_event():
    """Initialize vector store and agents on startup."""
    print("[STARTUP] PolicyGPT Bharat starting up...")
    try:
        # Initialize HuggingFace authentication if token is available
        if settings.hf_token:
            try:
                from huggingface_hub import login
                login(token=settings.hf_token)
                print("[HF] HuggingFace authenticated")
            except Exception as e:
                print(f"[WARNING] HuggingFace authentication warning: {e}")
        
        # Initialize database
        orchestrator.alert_agent.initialize_db(db_service)
        if db_service.is_available:
            print("[DB] MongoDB: Connected and ready")
        else:
            print("[WARNING] MongoDB: Not available, using in-memory storage")

        # Explicitly ingest only when the vector DB is empty.
        # This keeps normal Render restarts fast while still self-healing
        # after a fresh deploy or empty ChromaDB volume.
        if _vector_db_has_data():
            print("[RAG] Vector DB already populated; skipping ingestion")
        else:
            print("[RAG] Vector DB empty; building ChromaDB index once...")
            ingester = SchemeIngester()
            chunk_count = ingester.build_index()
            print(f"[RAG] Ingestion completed: {chunk_count} chunks indexed")

        # Initialize vector store and agents
        orchestrator.initialize()
        status = orchestrator.vector_store_status
        print(f"[RAG] Vector DB: {status['total_chunks']} chunks, {status['total_schemes']} schemes")
        print("[STARTUP] All agents initialized successfully")
    except Exception as e:
        print(f"[WARNING] Startup warning: {e}")
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


@app.get("/ready")
async def ready_check():
    """Readiness check - returns 200 only if fully initialized and ready for chat."""
    try:
        status = orchestrator.vector_store_status
        if status.get("initialized") and status.get("total_chunks", 0) > 0:
            return {
                "ready": True,
                "initialized": True,
                "total_schemes": status.get("total_schemes", 0),
                "total_chunks": status.get("total_chunks", 0),
                "message": "Backend is ready to accept chat requests",
            }
        else:
            return {
                "ready": False,
                "initialized": False,
                "message": "Backend is initializing... Please wait",
            }
    except Exception as e:
        return {
            "ready": False,
            "initialized": False,
            "message": f"Backend error: {str(e)}",
        }


@app.post("/auth/google", response_model=AuthResponse)
async def google_auth(request: FirebaseAuthRequest):
    """
    Google Authentication endpoint.
    Verifies Firebase ID token, creates/retrieves user from MongoDB.
    Handles merging guest data if provided.
    
    Flow:
    1. Verify Firebase token
    2. Extract uid, email, name from token
    3. If guest_firebase_uid provided, merge guest data
    4. Query MongoDB for existing user or create new
    5. Return user data with profileCompleted status
    """
    try:
        # Verify Firebase token
        verified_token = firebase_service.verify_token(request.token)
        if not verified_token:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        # Validate required claims
        uid = verified_token.get('uid')
        email = verified_token.get('email')
        if not uid or not email:
            raise HTTPException(status_code=400, detail="Missing required token claims: uid and email required")
        
        # Derive name safely - prefer Firebase name claim, fallback to uid
        name = verified_token.get('name') or uid
        picture = verified_token.get('picture')

        # If user was previously a guest, merge data
        if request.guest_firebase_uid and db_service.is_available:
            merge_result = db_service.merge_guest_to_authenticated(
                request.guest_firebase_uid,
                uid
            )
            if merge_result.get("merged"):
                print(f"[Auth] Guest data merged: {request.guest_firebase_uid} → {uid}")

        # Query MongoDB for existing user
        existing_user = None
        if db_service.is_available:
            existing_user = db_service.get_user_by_firebase_uid(uid)

        if existing_user:
            # Existing user - return their data
            return AuthResponse(
                user=UserData(
                    uid=uid,
                    email=email,
                    name=existing_user.get('name', name),  # Use stored name if available
                    email_verified=verified_token.get('email_verified', False),
                    picture=existing_user.get('picture', picture),
                    profileCompleted=existing_user.get('profileCompleted', False),
                    profile=existing_user.get('profile'),
                    isGuest=False,
                ),
                message="User authenticated successfully",
                isNewUser=False,
            )
        else:
            # New user - create profile in MongoDB
            if db_service.is_available:
                new_user = {
                    'email': email,
                    'name': name,
                    'picture': picture,
                }
                db_service.create_user(uid, new_user, is_guest=False)

            return AuthResponse(
                user=UserData(
                    uid=uid,
                    email=email,
                    name=name,
                    email_verified=verified_token.get('email_verified', False),
                    picture=picture,
                    profileCompleted=False,
                    profile=None,
                    isGuest=False,
                ),
                message="New user created successfully",
                isNewUser=True,
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Auth] Authentication error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/guest")
async def create_guest_profile(request: GuestProfileRequest):
    """
    Create a temporary guest profile without authentication.
    Guest can use the app and create profiles.
    Later, when they sign in with Google, guest data is merged.
    
    Returns guest_firebase_uid to store on client side.
    """
    try:
        import uuid
        
        # Generate temporary guest UID
        guest_uid = f"guest_{uuid.uuid4().hex[:12]}"
        
        profile_dict = request.profile.model_dump(exclude_none=True)
        
        if db_service.is_available:
            guest_user = {
                'email': None,  # No email for guests
                'name': request.name,
                'picture': None,
            }
            
            result = db_service.create_user(guest_uid, guest_user, is_guest=True)
            
            # If profile data provided, save it immediately
            if profile_dict:
                db_service.update_user_profile(guest_uid, {**profile_dict, 'name': request.name})
            
            return {
                "guest_firebase_uid": guest_uid,
                "name": request.name,
                "profileCompleted": bool(profile_dict),
                "message": "Guest profile created successfully",
            }
        else:
            return {
                "guest_firebase_uid": guest_uid,
                "name": request.name,
                "profileCompleted": False,
                "message": "Database not available, guest profile created locally",
            }

    except Exception as e:
        print(f"[Auth] Guest creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint.
    Pipeline: Intent Classification → Route → (Conversational | Full Scheme Pipeline) → Response
    Passes chat history for multi-turn context.
    Saves chat history to MongoDB if available.
    """
    try:
        session_id = request.session_id or str(uuid.uuid4())
        user_id = request.user_id or str(uuid.uuid4())
        profile_dict = request.profile.model_dump(exclude_none=True) if request.profile else {}

        # Sanitize user input
        query = sanitize_input(request.query)
        # ── Fetch recent chat history for multi-turn context ──
        chat_history = []
        if db_service.is_available:
            try:
                raw_history = db_service.get_chat_history(user_id, session_id, limit=6)
                chat_history = [
                    {"role": msg.get("role", "user"), "content": msg.get("content", "")}
                    for msg in raw_history
                    if msg.get("content")
                ]
            except Exception as hist_err:
                print(f"[Chat] History fetch warning: {hist_err}")

        # ── Run the intelligent pipeline (with routing) ──
        result = orchestrator.run_pipeline(
            query=query,
            user_profile=profile_dict,
            chat_history=chat_history,
            language=request.language or "en",
        )

        # ── Save messages to MongoDB ──
        if db_service.is_available:
            user_message = {
                "role": "user",
                "content": query,
                "profile": profile_dict,
            }
            db_service.save_chat_message(user_id, session_id, user_message)

            assistant_message = {
                "role": "assistant",
                "content": result["response_text"],
                "intent": result["intent"],
                "schemes": result["schemes"],
                "schemes_found": len(result["schemes"]),
                "eligible_count": result["eligible_count"],
                "total_schemes": result["total_schemes"],
                "compliance_verified": result["compliance_verified"],
                "response_type": result.get("response_type", "scheme_results"),
            }
            db_service.save_chat_message(user_id, session_id, assistant_message)

        return ChatResponse(
            text=result["response_text"],
            schemes=result["schemes"],
            intent=result["intent"],
            session_id=session_id,
            eligible_count=result["eligible_count"],
            total_schemes=result["total_schemes"],
            compliance_verified=result["compliance_verified"],
            response_type=result.get("response_type", "scheme_results"),
        )

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[Chat] Error: {str(e)}")
        print(f"[Chat] Traceback:\n{error_trace}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profile")
async def update_profile(request: ProfileUpdateRequest):
    """
    Save/update user profile for personalized recommendations.
    Requires Firebase UID to associate profile with authenticated user.
    """
    try:
        firebase_uid = request.firebase_uid
        profile_dict = request.profile.model_dump(exclude_none=True)

        print(f"[API] Updating profile for user: {firebase_uid}")
        print(f"[API] Profile fields: {list(profile_dict.keys())}")

        # Update profile in MongoDB
        if db_service.is_available:
            result = db_service.update_user_profile(firebase_uid, profile_dict)
            return {
                "firebase_uid": firebase_uid,
                "profile": profile_dict,
                "saved": result.get("updated", False),
                "message": "Profile saved successfully" if result.get("updated") else "Failed to save profile",
            }
        else:
            return {
                "firebase_uid": firebase_uid,
                "profile": profile_dict,
                "saved": False,
                "message": "Database not available",
            }

    except Exception as e:
        print(f"[API] Error updating profile: {e}")
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
async def whatsapp_webhook(request: Request):
    """
    WhatsApp webhook endpoint.
    Handles both:
    - Twilio-formatted incoming messages (form-encoded: Body, From, To)
    - Direct JSON format: {"text": "...", "from": "+91...", "profile": {...}}
    """
    try:
        content_type = request.headers.get("content-type", "")

        if "application/x-www-form-urlencoded" in content_type:
            # Twilio webhook format
            form = await request.form()
            message_body = form.get("Body", "")
            from_phone = form.get("From", "")
        else:
            # JSON format (direct API call)
            data = await request.json()
            message_body = data.get("text", "")
            from_phone = data.get("from", "")

        if not message_body:
            return {"whatsapp_response": "Please send a valid query about government schemes."}

        # Sanitize input
        message_body = sanitize_input(message_body)

        # Process through WhatsApp service
        response_text = whatsapp_service.handle_incoming(
            message_body=message_body,
            from_phone=from_phone,
            orchestrator=orchestrator,
        )

        # If Twilio format, return TwiML
        if "application/x-www-form-urlencoded" in content_type:
            from fastapi.responses import Response
            twiml = (
                '<?xml version="1.0" encoding="UTF-8"?>'
                '<Response><Message>'
                f'{response_text}'
                '</Message></Response>'
            )
            return Response(content=twiml, media_type="application/xml")

        return {
            "whatsapp_response": response_text,
        }

    except Exception as e:
        print(f"[WhatsApp] Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class AlertSubscribeRequest(BaseModel):
    phone: str
    user_id: Optional[str] = None
    alert_types: List[str] = ["new_schemes", "deadline_reminders"]


@app.post("/alerts/subscribe")
async def subscribe_alerts(request: AlertSubscribeRequest):
    """
    Subscribe a user's phone number for WhatsApp scheme alerts.
    Alert types: new_schemes, deadline_reminders, eligibility_changes
    """
    try:
        phone = request.phone.strip()
        if not phone or len(phone) < 10:
            raise HTTPException(status_code=400, detail="Invalid phone number")

        subscription = {
            "phone": phone,
            "user_id": request.user_id,
            "alert_types": request.alert_types,
            "subscribed": True,
        }

        # Save subscription to MongoDB
        if db_service.is_available:
            db_service.save_alert_subscription(phone, subscription)

        # Send confirmation via WhatsApp
        if whatsapp_service.is_available:
            whatsapp_service.send_message(
                phone,
                "🔔 *PolicySetu Alert Subscription*\n\n"
                "You're now subscribed to scheme alerts! "
                "You'll receive notifications about:\n"
                + "\n".join(f"• {t.replace('_', ' ').title()}" for t in request.alert_types)
                + "\n\n_Reply STOP to unsubscribe._",
            )

        return {
            "subscribed": True,
            "phone": phone,
            "alert_types": request.alert_types,
            "message": "Successfully subscribed to alerts",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AlertSendRequest(BaseModel):
    phone: str
    user_id: Optional[str] = None


@app.post("/alerts/send")
async def send_scheme_alerts(request: AlertSendRequest):
    """
    Trigger scheme alerts for a specific user.
    Runs the missed benefits detector and sends results via WhatsApp.
    """
    try:
        # Get user profile from DB
        profile = {}
        if request.user_id and db_service.is_available:
            user = db_service.get_user_by_firebase_uid(request.user_id)
            if user:
                profile = user.get("profile", {})

        # Run missed benefits detection
        result = orchestrator.detect_missed_benefits(profile)

        if result["count"] > 0 and whatsapp_service.is_available:
            whatsapp_service.send_missed_benefits(
                phone=request.phone,
                schemes=result["missed_schemes"],
            )

        return {
            "sent": result["count"] > 0 and whatsapp_service.is_available,
            "schemes_found": result["count"],
            "message": result["message"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= Admin / Freshness Endpoints =============


@app.get("/admin/freshness-report")
async def get_freshness_report(
    api_key: str = Query(..., description="Admin API key"),
    check_links: bool = Query(False, description="Also check link health (slow)"),
):
    """
    Admin endpoint: Get freshness report for all schemes.
    Reports stale data (>90 days old) and optionally checks link health.
    Protected with a simple API key.
    """
    # Simple API key protection
    expected_key = settings.admin_api_key
    if not expected_key or api_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid admin API key")

    try:
        schemes = orchestrator.schemes_db

        if check_links:
            # Full report with link health checks (slow — ~1s per scheme)
            report = freshness_checker.generate_freshness_report(schemes)
        else:
            # Quick report: staleness only
            stale = freshness_checker.flag_stale_schemes(schemes)
            report = {
                "total_schemes": len(schemes),
                "stale_count": len(stale),
                "stale_schemes": stale,
                "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
            }

        return report

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/schemes/{scheme_id}/guide")
async def get_scheme_guide(scheme_id: str):
    """
    Get full application guide for a specific scheme.
    Returns structured data: steps, documents, deadlines, helpline, and freshness.
    """
    try:
        schemes = orchestrator.schemes_db
        scheme = next(
            (s for s in schemes if s.get("scheme_id", "").upper() == scheme_id.upper()),
            None,
        )
        if not scheme:
            raise HTTPException(status_code=404, detail=f"Scheme '{scheme_id}' not found")

        # Build guide from action agent
        action_info = orchestrator.action_agent.get_action_info(scheme)

        # Add freshness info
        staleness = freshness_checker.get_staleness_info(scheme)

        return {
            "scheme_id": scheme.get("scheme_id"),
            "scheme_name": scheme.get("scheme_name"),
            "category": scheme.get("category"),
            "description": scheme.get("description"),
            "eligibility": scheme.get("eligibility"),
            "benefits": scheme.get("benefits"),
            "application_steps": action_info["application_steps"],
            "required_documents": action_info["required_documents"],
            "official_link": action_info["official_link"],
            "ministry": action_info.get("ministry", scheme.get("ministry", "")),
            "launch_year": scheme.get("launch_year"),
            "estimated_time": scheme.get("estimated_time", "2-4 weeks for processing"),
            "deadline_info": scheme.get("deadline_info", "Ongoing — no fixed deadline"),
            "helpline_number": scheme.get("helpline_number", "Not available"),
            "freshness": staleness,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= Chat History Endpoints =============


@app.post("/chat/save-message")
async def save_chat_message(data: Dict):
    """Save individual chat message to database."""
    try:
        user_id = data.get("user_id", str(uuid.uuid4()))
        session_id = data.get("session_id", str(uuid.uuid4()))
        message = data.get("message", {})

        if not db_service.is_available:
            return {
                "saved": False,
                "message": "Database not available. Chat history stored locally only."
            }

        result = db_service.save_chat_message(user_id, session_id, message)

        return {
            **result,
            "user_id": user_id,
            "session_id": session_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat/history/{user_id}")
async def get_chat_history(
    user_id: str,
    session_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100)
):
    """Retrieve chat history for a user or specific session."""
    try:
        messages = db_service.get_chat_history(user_id, session_id, limit)

        return {
            "user_id": user_id,
            "session_id": session_id,
            "messages": messages,
            "count": len(messages),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/session")
async def save_chat_session(data: Dict):
    """Save complete chat session to database."""
    try:
        user_id = data.get("user_id", str(uuid.uuid4()))
        session_id = data.get("session_id", str(uuid.uuid4()))
        messages = data.get("messages", [])
        metadata = data.get("metadata", {})

        if not db_service.is_available:
            return {
                "saved": False,
                "message": "Database not available."
            }

        result = db_service.save_full_session(
            user_id,
            session_id,
            messages,
            metadata
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/db/stats")
async def get_database_stats():
    """Get database statistics (admin endpoint)."""
    try:
        stats = db_service.get_database_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= WhatsApp / Alerts Routes =============


@app.post("/alerts/subscribe")
async def subscribe_alerts(request: AlertSubscribeRequest):
    """Subscribe a user/phone to WhatsApp alerts."""
    try:
        user_id = request.user_id or "anonymous"
        # Just return success for demo purposes if DB/Twilio is not configured
        if not db_service.is_available:
            return {"status": "success", "message": "Subscribed (in-memory)"}
            
        profile = db_service.get_user_profile(user_id) or {}
        profile["phone"] = request.phone
        profile["alert_types"] = request.alert_types
        db_service.save_user_profile(user_id, profile)
        
        return {"status": "success", "message": "Successfully subscribed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/alerts/send")
async def send_alert(request: AlertSendRequest):
    """Trigger an alert for a specific user."""
    try:
        profile = db_service.get_user_profile(request.user_id)
        if not profile or "phone" not in profile:
            raise HTTPException(status_code=400, detail="User phone not found")
            
        result = orchestrator.alert_agent.schedule_alert(
            user_id=request.user_id,
            scheme_id=request.scheme_id,
            alert_type=request.alert_type,
            phone=profile["phone"],
            whatsapp_service=whatsapp_service
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    """Twilio WhatsApp webhook endpoint for two-way chat."""
    try:
        # Twilio sends form data
        form_data = await request.form()
        message_body = form_data.get("Body", "")
        from_phone = form_data.get("From", "")
        
        # Pass to whatsapp service which runs orchestrator pipeline
        response_text = whatsapp_service.handle_incoming(
            message_body, 
            from_phone, 
            orchestrator
        )
        
        # Twilio expects TwiML XML response, but we can also just let the 
        # WhatsAppService.handle_incoming send the reply asynchronously 
        # or we return TwiML here. For now, returning simple TwiML.
        xml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{response_text}</Message>
</Response>"""
        from fastapi.responses import Response
        return Response(content=xml_response, media_type="application/xml")
        
    except Exception as e:
        print(f"[WhatsApp Webhook] Error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


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
