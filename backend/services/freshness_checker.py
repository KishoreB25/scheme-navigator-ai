"""
Freshness Checker Service
Verifies that scheme data is current by:
  1. Checking official URL health (HTTP HEAD → 200 OK)
  2. Tracking last_verified timestamps
  3. Flagging schemes that haven't been verified in >N days

Uses httpx for efficient async/sync HTTP requests.
"""

import httpx
from datetime import datetime, timedelta
from typing import Dict, List, Optional


class FreshnessChecker:
    """Checks freshness and link health for scheme data."""

    DEFAULT_MAX_AGE_DAYS = 90
    REQUEST_TIMEOUT = 10  # seconds

    def __init__(self, db_service=None):
        self._db = db_service

    def check_url_health(self, url: str) -> Dict:
        """
        Check if a URL is alive via HTTP HEAD request.
        Returns {"url": str, "alive": bool, "status_code": int|None, "error": str|None}
        """
        if not url or url == "N/A" or not url.startswith("http"):
            return {
                "url": url,
                "alive": False,
                "status_code": None,
                "error": "Invalid or missing URL",
            }

        try:
            with httpx.Client(
                timeout=self.REQUEST_TIMEOUT,
                follow_redirects=True,
                verify=False,  # Government sites may have cert issues
            ) as client:
                response = client.head(url)
                alive = response.status_code < 400
                return {
                    "url": url,
                    "alive": alive,
                    "status_code": response.status_code,
                    "error": None if alive else f"HTTP {response.status_code}",
                }
        except httpx.TimeoutException:
            return {
                "url": url,
                "alive": False,
                "status_code": None,
                "error": "Request timed out",
            }
        except Exception as e:
            return {
                "url": url,
                "alive": False,
                "status_code": None,
                "error": str(e)[:100],
            }

    def get_last_verified(self, scheme: Dict) -> Optional[str]:
        """
        Return the last_verified date for a scheme.
        Checks the scheme dict directly (from schemes_data.json).
        """
        return scheme.get("last_verified")

    def is_stale(
        self, scheme: Dict, max_age_days: int = None
    ) -> bool:
        """Check if a scheme's data is stale (not verified within max_age_days)."""
        max_age = max_age_days or self.DEFAULT_MAX_AGE_DAYS
        last_verified = self.get_last_verified(scheme)

        if not last_verified:
            return True  # No verification date = stale by default

        try:
            verified_date = datetime.strptime(last_verified, "%Y-%m-%d")
            age_days = (datetime.utcnow() - verified_date).days
            return age_days > max_age
        except (ValueError, TypeError):
            return True

    def get_staleness_info(self, scheme: Dict) -> Dict:
        """Get detailed staleness information for a scheme."""
        last_verified = self.get_last_verified(scheme)
        stale = self.is_stale(scheme)

        days_old = None
        if last_verified:
            try:
                verified_date = datetime.strptime(last_verified, "%Y-%m-%d")
                days_old = (datetime.utcnow() - verified_date).days
            except (ValueError, TypeError):
                pass

        return {
            "scheme_id": scheme.get("scheme_id", "N/A"),
            "scheme_name": scheme.get("scheme_name", "Unknown"),
            "last_verified": last_verified,
            "days_since_verified": days_old,
            "is_stale": stale,
            "status": "⚠️ Stale" if stale else "✅ Verified",
        }

    def flag_stale_schemes(
        self, schemes: List[Dict], max_age_days: int = None
    ) -> List[Dict]:
        """Return list of schemes that haven't been verified within threshold."""
        return [
            self.get_staleness_info(scheme)
            for scheme in schemes
            if self.is_stale(scheme, max_age_days)
        ]

    def generate_freshness_report(self, schemes: List[Dict]) -> Dict:
        """
        Generate a comprehensive freshness report for all schemes.
        Checks both staleness and link health.
        """
        report = {
            "total_schemes": len(schemes),
            "stale_count": 0,
            "broken_links": 0,
            "healthy_count": 0,
            "schemes": [],
            "generated_at": datetime.utcnow().isoformat(),
        }

        for scheme in schemes:
            staleness = self.get_staleness_info(scheme)
            url = scheme.get("official_link", "")
            link_health = self.check_url_health(url)

            entry = {
                **staleness,
                "official_link": url,
                "link_alive": link_health["alive"],
                "link_status": link_health.get("status_code"),
                "link_error": link_health.get("error"),
            }

            report["schemes"].append(entry)

            if staleness["is_stale"]:
                report["stale_count"] += 1
            if not link_health["alive"]:
                report["broken_links"] += 1
            if not staleness["is_stale"] and link_health["alive"]:
                report["healthy_count"] += 1

        return report
