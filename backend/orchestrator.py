"""
Pipeline Orchestrator for PolicySetu (Scheme Navigator AI)

Implements intelligent routing:
  - Conversational queries (greetings, thanks, off-topic) → LLM direct response
  - Scheme queries (search, eligibility, apply, details) → full RAG pipeline
  - Follow-up queries → context-aware pipeline with chat history

Full agent pipeline for scheme queries:
  query → query_agent → rag_agent → eligibility_agent → guardrail → action_agent → response
"""

from typing import Dict, List, Optional, Set

from agents import (
    QueryAgent,
    RAGAgent,
    EligibilityAgent,
    ComplianceAgent,
    ActionAgent,
    AlertAgent,
)
from services.llm_service import GeminiService
from config.prompts import GREETING_FALLBACK


# Intents that skip the RAG pipeline entirely
CONVERSATIONAL_INTENTS = {"greeting", "offtopic"}

# Intents that need RAG pipeline but also use chat history
CONTEXT_AWARE_INTENTS = {"follow_up", "comparison"}

# Intents that trigger the full scheme pipeline
SCHEME_INTENTS = {"search", "eligibility", "apply", "details"}


class PipelineOrchestrator:
    """
    Central orchestrator wiring all 6 agents + intelligent routing:
    1. Query Understanding Agent
    2. RAG Retrieval Agent
    3. Eligibility Agent
    4. Compliance Guardrail Agent
    5. Action Agent
    6. Alert Agent
    """

    def __init__(self):
        self.query_agent = QueryAgent()
        self.rag_agent = RAGAgent()
        self.eligibility_agent = EligibilityAgent()
        self.compliance_agent = ComplianceAgent()
        self.action_agent = ActionAgent()
        self.alert_agent = AlertAgent()
        self.llm_service = GeminiService()
        self._initialized = False

    def initialize(self):
        """Initialize all agents (triggers lazy loading of vector DB)."""
        if self._initialized:
            return
        self.rag_agent.initialize()
        self._initialized = True

    def _classify_intent(
        self,
        query: str,
        user_profile: Dict,
        chat_history: List[Dict] = None,
    ) -> str:
        """
        Classify user intent using LLM (primary) with regex fallback.
        Returns one of: greeting, follow_up, search, eligibility, apply, details, comparison, offtopic
        """
        # ── Try LLM-based classification first (more accurate) ──
        if self.llm_service.is_available:
            llm_result = self.llm_service.classify_intent(
                query=query,
                chat_history=chat_history,
                profile=user_profile,
            )
            if llm_result and llm_result.get("intent"):
                intent = llm_result["intent"]
                print(f"[Orchestrator] LLM intent: {intent} ({llm_result.get('reasoning', '')})")
                return intent

        # ── Fallback: regex-based classification from QueryAgent ──
        regex_result = self.query_agent.process(query, user_profile)
        intent = regex_result.get("intent", "search")

        # Additional heuristic: detect greetings that regex misses
        query_lower = query.strip().lower()
        greeting_words = {
            "hi", "hello", "hey", "namaste", "namaskar", "good morning",
            "good evening", "good afternoon", "thanks", "thank you",
            "bye", "goodbye", "ok", "okay", "sure", "hmm", "hm",
        }
        if query_lower in greeting_words or len(query_lower.split()) <= 2 and query_lower in greeting_words:
            intent = "greeting"

        print(f"[Orchestrator] Regex intent: {intent}")
        return intent

    def _handle_conversational(
        self,
        query: str,
        user_profile: Dict,
        chat_history: List[Dict] = None,
    ) -> Dict:
        """Handle greetings, thanks, off-topic — no scheme pipeline needed."""
        # Try LLM for a natural conversational response
        response_text = None
        if self.llm_service.is_available:
            response_text = self.llm_service.generate_conversational_response(
                query=query,
                chat_history=chat_history,
                profile=user_profile,
            )

        # Fallback to static greeting
        if not response_text:
            response_text = GREETING_FALLBACK

        return {
            "response_text": response_text,
            "schemes": [],
            "intent": "greeting",
            "entities": {},
            "total_schemes": 0,
            "eligible_count": 0,
            "compliance_verified": True,
            "response_type": "conversational",
        }

    def run_pipeline(
        self,
        query: str,
        user_profile: Dict = None,
        chat_history: List[Dict] = None,
    ) -> Dict:
        """
        Execute the intelligent pipeline:
        1. Classify intent (LLM or regex)
        2. Route: conversational → direct LLM | scheme → full pipeline
        3. Return response with type indicator
        """
        self.initialize()
        user_profile = user_profile or {}
        chat_history = chat_history or []

        # ─── Step 0: Intent Classification ───
        intent = self._classify_intent(query, user_profile, chat_history)

        # ─── Route: Conversational (no RAG needed) ───
        if intent in CONVERSATIONAL_INTENTS:
            return self._handle_conversational(query, user_profile, chat_history)

        # ─── Route: Scheme Pipeline (full RAG) ───
        return self._run_scheme_pipeline(
            query, user_profile, intent, chat_history
        )

    def _run_scheme_pipeline(
        self,
        query: str,
        user_profile: Dict,
        intent: str,
        chat_history: List[Dict] = None,
    ) -> Dict:
        """
        Full scheme pipeline:
        query → query_agent → rag_agent → eligibility_agent → guardrail → action_agent → response
        """
        # ─── Step 1: Query Understanding Agent ───
        query_result = self.query_agent.process(query, user_profile)
        entities = query_result["entities"]

        # Override intent from LLM classification (already done above)
        # but still use regex entities

        # Merge profile with extracted entities (entities override profile)
        merged_profile = {**user_profile}
        for key, value in entities.items():
            if value is not None and key not in ("categories", "scheme_name"):
                merged_profile[key] = value

        # ─── Step 2: RAG Retrieval Agent ───
        rag_result = self.rag_agent.process(query, entities)
        retrieved_schemes = rag_result["retrieved_schemes"]

        # ─── Step 3: Eligibility Agent ───
        eligibility_result = self.eligibility_agent.process(
            retrieved_schemes, merged_profile
        )

        # Use all schemes with status (not just eligible) for complete picture
        all_schemes_with_status = eligibility_result["all_schemes_with_status"]

        # ─── Step 4: Compliance Guardrail Agent ───
        compliance_result = self.compliance_agent.process(
            all_schemes_with_status, query, intent,
            llm_service=self.llm_service, profile=merged_profile,
            chat_history=chat_history,
        )

        # ─── Step 5: Action Agent ───
        action_result = self.action_agent.process(retrieved_schemes)
        # Merge action steps into compliance-validated schemes
        for scheme in compliance_result["schemes"]:
            scheme_id = scheme.get("id", "")
            for action in action_result["actions"]:
                if action.get("scheme_id") == scheme_id or action.get("scheme_name") == scheme.get("name"):
                    scheme["application_steps"] = action["application_steps"]
                    scheme["required_documents"] = action["required_documents"]
                    scheme["official_link"] = action.get("official_link", scheme.get("official_link", ""))
                    break

        return {
            "response_text": compliance_result["response_text"],
            "schemes": compliance_result["schemes"],
            "intent": intent,
            "entities": entities,
            "total_schemes": compliance_result["total_schemes"],
            "eligible_count": eligibility_result["eligible_count"],
            "compliance_verified": True,
            "response_type": "scheme_results",
        }

    def detect_missed_benefits(
        self,
        user_profile: Dict,
        already_shown_ids: Set[str] = None,
    ) -> Dict:
        """
        Missed Benefits Detector:
        Scans ALL schemes against user profile to find unclaimed benefits.
        """
        self.initialize()
        all_schemes = self.rag_agent.schemes_db
        missed = self.alert_agent.detect_missed_benefits(
            user_profile, all_schemes, already_shown_ids
        )

        # Run through compliance validation
        validated = self.compliance_agent.validate_response(missed)

        return {
            "missed_schemes": validated,
            "count": len(validated),
            "message": (
                f"🔥 You are eligible for {len(validated)} additional scheme(s) "
                f"you might not be aware of!"
                if validated
                else "No additional missed schemes found based on your profile."
            ),
        }

    @property
    def schemes_db(self) -> List[Dict]:
        """Access raw scheme data."""
        self.initialize()
        return self.rag_agent.schemes_db

    @property
    def total_schemes(self) -> int:
        """Total number of schemes in the database."""
        return len(self.schemes_db)

    @property
    def vector_store_status(self) -> Dict:
        """Get vector store health status."""
        self.initialize()
        return {
            "total_chunks": self.rag_agent._vector_store.total_chunks if self.rag_agent._vector_store else 0,
            "total_schemes": len(self.rag_agent.schemes_db),
            "initialized": self._initialized,
        }
