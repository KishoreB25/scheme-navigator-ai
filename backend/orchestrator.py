"""
Pipeline Orchestrator for PolicyGPT Bharat

Implements the full agent pipeline:
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


class PipelineOrchestrator:
    """
    Central orchestrator wiring all 6 agents:
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

    def run_pipeline(self, query: str, user_profile: Dict = None) -> Dict:
        """
        Execute the full pipeline:
        query → query_agent → rag_agent → eligibility_agent → guardrail → action_agent → response
        """
        self.initialize()
        user_profile = user_profile or {}

        # ─── Step 1: Query Understanding Agent ───
        query_result = self.query_agent.process(query, user_profile)
        intent = query_result["intent"]
        entities = query_result["entities"]

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
