"""
Alert Agent
Manages user profiles and personalized alerts
"""

from typing import Dict, List
from datetime import datetime


class AlertAgent:
    """Manages alerts and user profiles"""

    def __init__(self):
        self.user_profiles = {}  # Simple in-memory storage
        self.alerts = {}

    def save_profile(self, user_id: str, profile: Dict) -> Dict:
        """Save user profile"""
        profile_copy = profile.copy()
        profile_copy["last_updated"] = datetime.now().isoformat()

        self.user_profiles[user_id] = profile_copy

        return {
            "user_id": user_id,
            "profile": profile_copy,
            "saved": True,
        }

    def get_profile(self, user_id: str) -> Dict:
        """Get user profile"""
        if user_id in self.user_profiles:
            return self.user_profiles[user_id]

        return None

    def generate_alerts(self, user_id: str, new_schemes: List[Dict]) -> Dict:
        """Generate personalized alerts"""
        alerts = []

        for scheme in new_schemes:
            alert = {
                "scheme_name": scheme.get("name"),
                "message": f"New scheme available: {scheme.get('name')}",
                "timestamp": datetime.now().isoformat(),
                "scheme_id": scheme.get("id"),
            }
            alerts.append(alert)

        self.alerts[user_id] = alerts

        return {
            "user_id": user_id,
            "alerts": alerts,
            "count": len(alerts),
        }

    def process(self, user_id: str = None, profile: Dict = None) -> Dict:
        """Process alerts"""
        if profile and user_id:
            self.save_profile(user_id, profile)

        return {
            "user_id": user_id,
            "alerts_generated": True,
        }
