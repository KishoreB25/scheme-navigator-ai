"""
LLM Service for PolicySetu (Scheme Navigator AI)
Uses Groq (Llama 3.3 70B) for:
  - Intent classification (conversational vs. scheme query)
  - Grounded scheme responses with citations
  - Conversational responses (greetings, follow-ups)
Falls back to template responses if API call fails.
"""

import json
from typing import Dict, List, Optional

from groq import Groq

from config.settings import settings
from config.prompts import (
    SYSTEM_PROMPT,
    GEMINI_RESPONSE_PROMPT,
    CONVERSATIONAL_PROMPT,
    QUERY_CLASSIFICATION_PROMPT,
    FOLLOW_UP_PROMPT,
    GREETING_FALLBACK,
)


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

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> Optional[str]:
        """Low-level Groq API call. Returns text or None on failure."""
        if not self._available or not self._client:
            return None

        try:
            response = self._client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            text = response.choices[0].message.content.strip()
            return text if text else None
        except Exception as e:
            print(f"[LLM] Groq API call failed: {e}")
            return None

    def _format_chat_history(self, chat_history: List[Dict]) -> str:
        """Format chat history into a readable string for prompts."""
        if not chat_history:
            return "No previous messages."

        lines = []
        for msg in chat_history[-5:]:  # Last 5 messages max
            role = msg.get("role", "user").capitalize()
            content = msg.get("content", "")
            # Truncate long messages
            if len(content) > 200:
                content = content[:200] + "..."
            lines.append(f"  {role}: {content}")
        return "\n".join(lines)

    def _build_scheme_context(self, schemes: List[Dict]) -> str:
        """Build a concise text context from validated scheme data."""
        parts = []
        for i, scheme in enumerate(schemes, 1):
            s = []
            name = scheme.get('name', scheme.get('scheme_name', 'Unknown'))
            s.append(f"Scheme {i}: {name}")
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

            # Official link — critical for citation grounding
            official_link = scheme.get('official_link', 'N/A')
            s.append(f"  Official Link: {official_link}")

            # Citation source
            s.append(f"  [Cite this scheme as: Source: {official_link}]")

            parts.append("\n".join(s))

        return "\n\n".join(parts)

    # ── Intent Classification ─────────────────────────────────────────────────

    def classify_intent(
        self,
        query: str,
        chat_history: List[Dict] = None,
        profile: Dict = None,
    ) -> Dict:
        """
        Use LLM to classify user intent.
        Returns {"intent": str, "reasoning": str} or a fallback.
        """
        profile_text = json.dumps(profile, indent=2) if profile else "Not provided"
        history_text = self._format_chat_history(chat_history or [])

        user_prompt = QUERY_CLASSIFICATION_PROMPT.format(
            query=query,
            chat_history=history_text,
            profile=profile_text,
        )

        text = self._call_llm(
            system_prompt="You are an intent classifier. Respond with ONLY valid JSON.",
            user_prompt=user_prompt,
            temperature=0.1,
            max_tokens=128,
        )

        if text:
            try:
                # Strip markdown code fences if present
                cleaned = text.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[-1]
                    cleaned = cleaned.rsplit("```", 1)[0]
                result = json.loads(cleaned.strip())
                return {
                    "intent": result.get("intent", "search"),
                    "reasoning": result.get("reasoning", ""),
                }
            except (json.JSONDecodeError, KeyError):
                print(f"[LLM] Intent classification parse failed: {text[:100]}")

        # Fallback: return None so caller uses regex-based classification
        return None

    # ── Conversational Response ───────────────────────────────────────────────

    def generate_conversational_response(
        self,
        query: str,
        chat_history: List[Dict] = None,
        profile: Dict = None,
    ) -> Optional[str]:
        """
        Generate a response for non-scheme queries (greetings, thanks, etc.).
        Returns None if LLM is unavailable (caller should use GREETING_FALLBACK).
        """
        profile_text = json.dumps(profile, indent=2) if profile else "Not provided"
        history_text = self._format_chat_history(chat_history or [])

        user_prompt = CONVERSATIONAL_PROMPT.format(
            query=query,
            chat_history=history_text,
            profile=profile_text,
        )

        return self._call_llm(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.7,  # Slightly more creative for conversation
            max_tokens=256,
        )

    # ── Scheme Response (Grounded) ────────────────────────────────────────────

    def generate_response(
        self,
        query: str,
        schemes: List[Dict],
        intent: str,
        profile: Dict = None,
        chat_history: List[Dict] = None,
    ) -> Optional[str]:
        """
        Generate a grounded, citation-backed response about government schemes.
        Returns None if LLM is unavailable or call fails (caller should fallback).
        """
        if not self._available or not self._client:
            return None

        scheme_context = self._build_scheme_context(schemes)
        profile_text = json.dumps(profile, indent=2) if profile else "Not provided"
        history_text = self._format_chat_history(chat_history or [])

        user_prompt = GEMINI_RESPONSE_PROMPT.format(
            query=query,
            intent=intent,
            profile=profile_text,
            scheme_count=len(schemes),
            scheme_context=scheme_context,
            chat_history=history_text,
        )

        return self._call_llm(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3,
            max_tokens=1024,
        )

    # ── Follow-up Response ────────────────────────────────────────────────────

    def generate_follow_up_response(
        self,
        query: str,
        schemes: List[Dict],
        chat_history: List[Dict] = None,
        profile: Dict = None,
    ) -> Optional[str]:
        """
        Generate a response for follow-up questions using conversation context.
        """
        scheme_context = self._build_scheme_context(schemes) if schemes else "No scheme data available."
        profile_text = json.dumps(profile, indent=2) if profile else "Not provided"
        history_text = self._format_chat_history(chat_history or [])

        user_prompt = FOLLOW_UP_PROMPT.format(
            query=query,
            chat_history=history_text,
            profile=profile_text,
            scheme_count=len(schemes) if schemes else 0,
            scheme_context=scheme_context,
        )

        return self._call_llm(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3,
            max_tokens=1024,
        )
