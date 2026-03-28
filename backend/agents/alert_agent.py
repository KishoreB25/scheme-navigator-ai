"""
Alert Agent
Manages user profiles and implements Missed Benefits Detection.
Scans all schemes against a user profile to find unclaimed benefits.
Uses MongoDB for persistence.
"""

from typing import Dict, List, Optional, Set
from datetime import datetime


class AlertAgent:
    """Manages alerts, user profiles, and missed benefits detection."""

    def __init__(self):
        self.user_profiles: Dict[str, Dict] = {}  # In-memory fallback
        self.alerts: Dict[str, List] = {}
        self._db = None

    def initialize_db(self, db_service):
        """Initialize database service for persistence"""
        self._db = db_service

    def save_profile(self, user_id: str, profile: Dict) -> Dict:
        """Save user profile (to MongoDB if available, else in-memory)."""
        profile_copy = profile.copy()
        profile_copy["last_updated"] = datetime.utcnow().isoformat()

        # Save to MongoDB if available
        if self._db and self._db.is_available:
            return self._db.save_user_profile(user_id, profile_copy)

        # Fallback: in-memory storage
        self.user_profiles[user_id] = profile_copy
        return {
            "user_id": user_id,
            "profile": profile_copy,
            "saved": True,
        }

    def get_profile(self, user_id: str) -> Optional[Dict]:
        """Get user profile (from MongoDB if available)."""
        # Try MongoDB first
        if self._db and self._db.is_available:
            profile = self._db.get_user_profile(user_id)
            if profile:
                return profile

        # Fallback: in-memory
        return self.user_profiles.get(user_id)

    def detect_missed_benefits(
        self,
        user_profile: Dict,
        all_schemes: List[Dict],
        already_shown: Set[str] = None,
        user_id: str = None,
    ) -> List[Dict]:
        """
        Missed Benefits Detector:
        Input: user profile
        Process: scan all schemes
        Output: schemes user is eligible for but didn't ask about
        """
        from agents.eligibility_agent import EligibilityAgent

        eligibility_agent = EligibilityAgent()
        already_shown = already_shown or set()
        missed_schemes = []

        for scheme in all_schemes:
            scheme_id = scheme.get("scheme_id", scheme.get("id", ""))

            # Skip schemes already shown to user
            if scheme_id in already_shown:
                continue

            result = eligibility_agent.check_eligibility(user_profile, scheme)

            if result["eligible"]:
                scheme_copy = scheme.copy()
                scheme_copy["eligible"] = True
                scheme_copy["eligibility_status"] = result["overall_status"]
                scheme_copy["eligibility_reasons"] = result["reasons"]
                scheme_copy["missed_benefit"] = True

                # Calculate a relevance score based on how many criteria matched
                match_count = sum(1 for r in result["reasons"] if r["status"] == "✅")
                scheme_copy["relevance_score"] = match_count

                missed_schemes.append(scheme_copy)

        # Sort by relevance (most criteria matched first)
        missed_schemes.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)

        # Save to MongoDB if user_id provided
        if user_id and self._db and self._db.is_available:
            self._db.save_missed_scheme_detection(
                user_id,
                user_profile,
                missed_schemes
            )

        return missed_schemes

    def generate_alerts(self, user_id: str, new_schemes: List[Dict]) -> Dict:
        """Generate personalized alerts for new schemes."""
        alerts = []

        for scheme in new_schemes:
            alert = {
                "scheme_name": scheme.get("scheme_name", scheme.get("name")),
                "scheme_id": scheme.get("scheme_id", scheme.get("id")),
                "message": f"You may be eligible for: {scheme.get('scheme_name', scheme.get('name', 'Unknown'))}",
                "benefits_summary": scheme.get("benefits", ""),
                "timestamp": datetime.utcnow().isoformat(),
                "official_link": scheme.get("official_link", ""),
            }
            alerts.append(alert)

        self.alerts[user_id] = alerts

        return {
            "user_id": user_id,
            "alerts": alerts,
            "count": len(alerts),
        }

    def process(self, user_id: str = None, profile: Dict = None) -> Dict:
        """Process alerts for a user."""
        if profile and user_id:
            self.save_profile(user_id, profile)

        return {
            "user_id": user_id,
            "alerts_generated": True,
        }
