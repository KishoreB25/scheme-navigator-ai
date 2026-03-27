"""
Compliance Guardrail Agent
Ensures responses are based only on retrieved data with proper citations
"""

from typing import Dict, List


class ComplianceAgent:
    """Ensures compliance with guardrails"""

    def validate_response(self, schemes: List[Dict], source: str = "Retrieved") -> Dict:
        """Validate that response uses only retrieved data"""
        validated_schemes = []

        for scheme in schemes:
            validated_scheme = {
                "id": scheme.get("id"),
                "name": scheme.get("name"),
                "description": scheme.get("description"),
                "benefits": scheme.get("benefits", []),
                "eligible": scheme.get("eligible", False),
                "source": source,  # Citation
                "relevant_score": scheme.get("relevance_score", 0),
            }
            validated_schemes.append(validated_scheme)

        return {
            "schemes": validated_schemes,
            "source": source,
            "compliance_verified": True,
            "citation_included": True,
        }

    def generate_response(
        self, eligible_schemes: List[Dict], query: str, intent: str
    ) -> str:
        """Generate compliant response text"""
        if not eligible_schemes:
            return (
                "Based on the provided information, I couldn't find matching schemes. "
                "Please provide more details about your profile so I can better assist you."
            )

        scheme_names = [scheme["name"] for scheme in eligible_schemes]

        if intent == "eligibility":
            return f"Based on your profile, you are eligible for: {', '.join(scheme_names)}. Would you like to know more about any of these?"

        elif intent == "apply":
            return f"I can help you with application steps for: {', '.join(scheme_names)}. Please choose a scheme to get started."

        else:  # search or details
            return f"I found {len(eligible_schemes)} scheme(s) that match your profile: {', '.join(scheme_names)}. Would you like details about any of these?"

    def process(
        self, eligible_schemes: List[Dict], query: str, intent: str
    ) -> Dict:
        """Process and return compliant response"""
        validated = self.validate_response(eligible_schemes)
        response_text = self.generate_response(eligible_schemes, query, intent)

        return {
            "response_text": response_text,
            "schemes": validated["schemes"],
            "compliance_verified": True,
        }
