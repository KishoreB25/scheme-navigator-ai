"""
Groq LLM Service for PolicyGPT Bharat
Generates natural-language responses grounded in retrieved scheme data.
Falls back to template responses if API call fails.
"""

import json
from typing import Dict, List, Optional

from groq import Groq

from config.settings import settings
from config.prompts import SYSTEM_PROMPT, GEMINI_RESPONSE_PROMPT


class GeminiService:
    """Wrapper around Groq API for grounded response generation."""

    def __init__(self):
        self._client = None
        self._available = False
        self._initialize()

    def _initialize(self):
        """Configure the Groq client."""
        api_key = settings.groq_api_key
        if not api_key:
            print("[LLM] No GROQ_API_KEY found. LLM generation disabled — using templates.")
            return

        try:
            self._client = Groq(api_key=api_key)
            self._available = True
            print(f"[LLM] Groq ({settings.groq_model}) initialized successfully ✅")
        except Exception as e:
            print(f"[LLM] Failed to initialize Groq: {e}")
            self._available = False

    @property
    def is_available(self) -> bool:
        return self._available

    def _build_scheme_context(self, schemes: List[Dict]) -> str:
        """Build a concise text context from validated scheme data."""
        parts = []
        for i, scheme in enumerate(schemes, 1):
            s = []
            s.append(f"Scheme {i}: {scheme.get('name', scheme.get('scheme_name', 'Unknown'))}")
            s.append(f"  ID: {scheme.get('id', scheme.get('scheme_id', 'N/A'))}")
            s.append(f"  Category: {scheme.get('category', 'N/A')}")
            s.append(f"  Description: {scheme.get('description', 'N/A')}")
            s.append(f"  Eligibility Status: {scheme.get('eligibility_status', 'N/A')}")

            # Eligibility reasons
            reasons = scheme.get("eligibility_reasons", [])
            if reasons:
                s.append("  Eligibility Breakdown:")
                for r in reasons:
                    s.append(f"    {r.get('status', '')} {r.get('criterion', '')}: {r.get('detail', '')}")

            # Benefits
            benefits = scheme.get("benefits", [])
            if benefits:
                s.append(f"  Benefits: {'; '.join(benefits) if isinstance(benefits, list) else benefits}")

            # Documents
            docs = scheme.get("documents_required", [])
            if docs:
                s.append(f"  Documents Required: {'; '.join(docs) if isinstance(docs, list) else docs}")

            # Application steps
            steps = scheme.get("application_steps", scheme.get("application_process", []))
            if steps:
                if isinstance(steps, list):
                    s.append(f"  How to Apply: {'; '.join(steps)}")
                else:
                    s.append(f"  How to Apply: {steps}")

            # Official link
            s.append(f"  Official Link: {scheme.get('official_link', 'N/A')}")

            parts.append("\n".join(s))

        return "\n\n".join(parts)

    def generate_response(
        self,
        query: str,
        schemes: List[Dict],
        intent: str,
        profile: Dict = None,
    ) -> Optional[str]:
        """
        Generate a natural-language response using Groq.
        Returns None if LLM is unavailable or call fails (caller should fallback).
        """
        if not self._available or not self._client:
            return None

        try:
            scheme_context = self._build_scheme_context(schemes)
            profile_text = json.dumps(profile, indent=2) if profile else "Not provided"

            user_prompt = GEMINI_RESPONSE_PROMPT.format(
                query=query,
                intent=intent,
                profile=profile_text,
                scheme_count=len(schemes),
                scheme_context=scheme_context,
            )

            response = self._client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=1024,
            )

            text = response.choices[0].message.content.strip()
            if text:
                return text
            return None

        except Exception as e:
            print(f"[LLM] Groq API call failed: {e}")
            return None
