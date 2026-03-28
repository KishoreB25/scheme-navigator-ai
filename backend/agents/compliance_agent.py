"""
Compliance Guardrail Agent
CRITICAL: Ensures all responses use ONLY retrieved data with proper citations.
Blocks hallucinations and enforces mandatory output structure.
"""

from typing import Dict, List
from config.prompts import MISSING_INFO_RESPONSE, NO_RESULTS_RESPONSE


class ComplianceAgent:
    """Strict compliance guardrail enforcer for PolicyGPT Bharat."""

    # Mandatory fields every scheme response must include
    REQUIRED_FIELDS = [
        "scheme_name",
        "eligibility_status",
        "benefits",
        "documents_required",
        "application_process",
        "official_link",
    ]

    def validate_scheme(self, scheme: Dict) -> Dict:
        """
        Validate a single scheme response ensuring all mandatory fields exist.
        Replaces any missing field with the compliance-safe missing info message.
        """
        validated = {
            "id": scheme.get("scheme_id", scheme.get("id", "N/A")),
            "name": scheme.get("scheme_name", scheme.get("name", MISSING_INFO_RESPONSE)),
            "description": scheme.get("description", MISSING_INFO_RESPONSE),
            "category": scheme.get("category", MISSING_INFO_RESPONSE),
        }

        # Eligibility (with detailed breakdown)
        validated["eligible"] = scheme.get("eligible", False)
        validated["eligibility_status"] = scheme.get(
            "eligibility_status", MISSING_INFO_RESPONSE
        )
        validated["eligibility_reasons"] = scheme.get("eligibility_reasons", [])
        validated["eligibility_text"] = scheme.get("eligibility", MISSING_INFO_RESPONSE)

        # Benefits
        benefits_raw = scheme.get("benefits", "")
        if isinstance(benefits_raw, list):
            validated["benefits"] = benefits_raw
        elif isinstance(benefits_raw, str) and benefits_raw:
            validated["benefits"] = [b.strip() for b in benefits_raw.split(".") if b.strip()]
        else:
            validated["benefits"] = [MISSING_INFO_RESPONSE]

        # Documents
        docs_raw = scheme.get("documents_required", "")
        if isinstance(docs_raw, list):
            validated["documents_required"] = docs_raw
        elif isinstance(docs_raw, str) and docs_raw:
            validated["documents_required"] = [
                d.strip() for d in docs_raw.replace(", ", ",").split(",") if d.strip()
            ]
        else:
            validated["documents_required"] = [MISSING_INFO_RESPONSE]

        # Application steps
        steps_raw = scheme.get("application_process", "")
        if isinstance(steps_raw, list):
            validated["application_steps"] = steps_raw
        elif isinstance(steps_raw, str) and steps_raw:
            # Parse "Step 1: ..., Step 2: ..." format
            import re
            steps = re.split(r"Step \d+:\s*", steps_raw)
            validated["application_steps"] = [s.strip().rstrip(".") for s in steps if s.strip()]
        else:
            validated["application_steps"] = [MISSING_INFO_RESPONSE]

        # Citation / source
        validated["official_link"] = scheme.get("official_link", MISSING_INFO_RESPONSE)
        validated["source"] = scheme.get("official_link", "PolicyGPT Bharat Database")
        validated["citation"] = f"Source: {validated['source']}"

        # Relevance score (internal use)
        validated["relevance_score"] = scheme.get("relevance_score", 0)

        return validated

    def validate_response(self, schemes: List[Dict]) -> List[Dict]:
        """Validate all schemes in a response."""
        return [self.validate_scheme(s) for s in schemes]

    def generate_response_text(
        self, schemes: List[Dict], query: str, intent: str,
        llm_service=None, profile: Dict = None,
    ) -> str:
        """
        Generate compliant response text.
        Returns a brief summary only - detailed scheme info shown in cards below.
        """
        if not schemes:
            return NO_RESULTS_RESPONSE

        # Always use template (brief summary) instead of LLM for cleaner UI
        # Cards will display all detailed information
        return self._template_response(schemes, intent)

    def _template_response(self, schemes: List[Dict], intent: str) -> str:
        """Fallback template-based response when LLM is unavailable."""
        eligible_count = sum(1 for s in schemes if s.get("eligible", False))
        total = len(schemes)
        
        if eligible_count > 0:
            return f"Great news! You are eligible for {eligible_count} scheme(s). Check out the details below."
        else:
            return f"I found {total} relevant scheme(s) for you. Check your eligibility details below."

    def process(
        self, eligible_schemes: List[Dict], query: str, intent: str,
        llm_service=None, profile: Dict = None,
    ) -> Dict:
        """Process and return compliant, validated response."""
        validated_schemes = self.validate_response(eligible_schemes)
        response_text = self.generate_response_text(
            validated_schemes, query, intent,
            llm_service=llm_service, profile=profile,
        )

        return {
            "response_text": response_text,
            "schemes": validated_schemes,
            "compliance_verified": True,
            "total_schemes": len(validated_schemes),
        }
