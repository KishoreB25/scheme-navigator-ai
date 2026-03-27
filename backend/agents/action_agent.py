"""
Action Agent
Provides application steps, required documents, and official links.
Reads data directly from retrieved scheme data (no hardcoded values).
"""

from typing import Dict, List
from config.prompts import MISSING_INFO_RESPONSE
import re


class ActionAgent:
    """Provides actionable steps for scheme applications."""

    def parse_steps(self, raw_steps: str) -> List[str]:
        """Parse application process text into a list of steps."""
        if not raw_steps:
            return [MISSING_INFO_RESPONSE]

        # Try splitting on "Step N:" pattern
        steps = re.split(r"Step \d+:\s*", raw_steps)
        steps = [s.strip().rstrip(".") for s in steps if s.strip()]

        if steps:
            return steps

        # Fallback: split on period or newline
        steps = [s.strip() for s in raw_steps.replace("\n", ".").split(".") if s.strip()]
        return steps if steps else [raw_steps]

    def parse_documents(self, raw_docs: str) -> List[str]:
        """Parse documents required text into a list."""
        if not raw_docs:
            return [MISSING_INFO_RESPONSE]

        if isinstance(raw_docs, list):
            return raw_docs

        # Split on commas or periods
        docs = [d.strip().rstrip(".") for d in raw_docs.split(",") if d.strip()]
        return docs if docs else [raw_docs]

    def get_action_info(self, scheme: Dict) -> Dict:
        """Extract action information from a scheme."""
        steps = self.parse_steps(scheme.get("application_process", ""))
        documents = self.parse_documents(scheme.get("documents_required", ""))
        official_link = scheme.get("official_link", MISSING_INFO_RESPONSE)

        return {
            "scheme_name": scheme.get("scheme_name", scheme.get("name", "Unknown")),
            "scheme_id": scheme.get("scheme_id", scheme.get("id", "")),
            "application_steps": steps,
            "required_documents": documents,
            "official_link": official_link,
            "ministry": scheme.get("ministry", MISSING_INFO_RESPONSE),
        }

    def process(self, schemes: List[Dict]) -> Dict:
        """Process and return action steps for all schemes."""
        action_items = []

        for scheme in schemes:
            action_info = self.get_action_info(scheme)
            action_items.append(action_info)

        return {
            "actions": action_items,
            "count": len(action_items),
        }
