"""
Eligibility Agent
Hybrid rule-based + reasoning engine for determining scheme eligibility.
Provides detailed per-criterion breakdown with ✅/❌/⚠️ indicators.
"""

from typing import Dict, List, Optional, Tuple


class EligibilityAgent:
    """Determines eligibility for government schemes using hybrid logic."""

    def check_eligibility(self, user_profile: Dict, scheme: Dict) -> Dict:
        """
        Check eligibility with detailed reasoning.
        Returns dict with overall status and per-criterion breakdown.
        """
        criteria = scheme.get("eligibility_criteria", {})
        reasons = []
        is_eligible = True
        has_missing_info = False

        # --- Age check ---
        age_min = criteria.get("age_min")
        age_max = criteria.get("age_max")
        user_age = user_profile.get("age")

        if age_min is not None or age_max is not None:
            if user_age is not None:
                if age_min and user_age < age_min:
                    reasons.append({
                        "criterion": "Age",
                        "status": "❌",
                        "detail": f"Minimum age is {age_min} years, your age is {user_age}",
                    })
                    is_eligible = False
                elif age_max and user_age > age_max:
                    reasons.append({
                        "criterion": "Age",
                        "status": "❌",
                        "detail": f"Maximum age is {age_max} years, your age is {user_age}",
                    })
                    is_eligible = False
                else:
                    age_range = f"{age_min or 'any'}-{age_max or 'any'}"
                    reasons.append({
                        "criterion": "Age",
                        "status": "✅",
                        "detail": f"Your age ({user_age}) is within the eligible range ({age_range})",
                    })
            else:
                has_missing_info = True
                reasons.append({
                    "criterion": "Age",
                    "status": "⚠️",
                    "detail": f"Age information not provided. Required range: {age_min or 'any'}-{age_max or 'any'} years",
                })

        # --- Income check ---
        income_max = criteria.get("income_max")
        user_income = user_profile.get("income")

        if income_max is not None:
            if user_income is not None:
                if user_income > income_max:
                    reasons.append({
                        "criterion": "Income",
                        "status": "❌",
                        "detail": f"Maximum annual income is ₹{income_max:,}. Your income (₹{user_income:,}) exceeds the limit",
                    })
                    is_eligible = False
                else:
                    reasons.append({
                        "criterion": "Income",
                        "status": "✅",
                        "detail": f"Your income (₹{user_income:,}) is within the limit of ₹{income_max:,}",
                    })
            else:
                has_missing_info = True
                reasons.append({
                    "criterion": "Income",
                    "status": "⚠️",
                    "detail": f"Income information not provided. Maximum annual income limit: ₹{income_max:,}",
                })

        # --- Occupation check ---
        required_occupations = criteria.get("occupation")
        user_occupation = user_profile.get("occupation", "").lower() if user_profile.get("occupation") else None

        if required_occupations:
            if user_occupation:
                eligible_occs = [o.lower() for o in required_occupations]
                if user_occupation in eligible_occs:
                    reasons.append({
                        "criterion": "Occupation",
                        "status": "✅",
                        "detail": f"Your occupation ({user_occupation}) matches the requirement",
                    })
                else:
                    reasons.append({
                        "criterion": "Occupation",
                        "status": "❌",
                        "detail": f"Required occupation: {', '.join(required_occupations)}. Your occupation: {user_occupation}",
                    })
                    is_eligible = False
            else:
                has_missing_info = True
                reasons.append({
                    "criterion": "Occupation",
                    "status": "⚠️",
                    "detail": f"Occupation not provided. Required: {', '.join(required_occupations)}",
                })

        # --- Gender check ---
        required_gender = criteria.get("gender")
        user_gender = user_profile.get("gender", "").lower() if user_profile.get("gender") else None

        if required_gender:
            if user_gender:
                if user_gender == required_gender.lower():
                    reasons.append({
                        "criterion": "Gender",
                        "status": "✅",
                        "detail": f"Gender requirement ({required_gender}) is met",
                    })
                else:
                    reasons.append({
                        "criterion": "Gender",
                        "status": "❌",
                        "detail": f"This scheme is for {required_gender} applicants only",
                    })
                    is_eligible = False
            else:
                has_missing_info = True
                reasons.append({
                    "criterion": "Gender",
                    "status": "⚠️",
                    "detail": f"Gender not provided. This scheme is for {required_gender} applicants",
                })

        # --- State check ---
        required_state = criteria.get("state")
        user_state = user_profile.get("state", "").lower() if user_profile.get("state") else None

        if required_state and required_state.lower() not in ["all india", "all", None, ""]:
            if user_state:
                if user_state in required_state.lower():
                    reasons.append({
                        "criterion": "State",
                        "status": "✅",
                        "detail": f"Your state ({user_state.title()}) is eligible",
                    })
                else:
                    reasons.append({
                        "criterion": "State",
                        "status": "❌",
                        "detail": f"This scheme is for {required_state} only",
                    })
                    is_eligible = False
            else:
                has_missing_info = True
                reasons.append({
                    "criterion": "State",
                    "status": "⚠️",
                    "detail": f"State not provided. This scheme applies to: {required_state}",
                })

        # --- Determine overall status ---
        if is_eligible and not has_missing_info:
            overall = "Eligible ✅"
        elif is_eligible and has_missing_info:
            overall = "Potentially Eligible ⚠️ (provide missing info for confirmation)"
        else:
            overall = "Not Eligible ❌"

        return {
            "eligible": is_eligible,
            "overall_status": overall,
            "has_missing_info": has_missing_info,
            "reasons": reasons,
        }

    def process(self, schemes: List[Dict], user_profile: Dict) -> Dict:
        """Process eligibility for all retrieved schemes."""
        eligible_schemes = []
        all_with_status = []

        for scheme in schemes:
            result = self.check_eligibility(user_profile, scheme)
            scheme_copy = scheme.copy()
            scheme_copy["eligible"] = result["eligible"]
            scheme_copy["eligibility_status"] = result["overall_status"]
            scheme_copy["eligibility_reasons"] = result["reasons"]
            scheme_copy["has_missing_info"] = result["has_missing_info"]

            all_with_status.append(scheme_copy)

            if result["eligible"]:
                eligible_schemes.append(scheme_copy)

        return {
            "eligible_schemes": eligible_schemes,
            "all_schemes_with_status": all_with_status,
            "eligible_count": len(eligible_schemes),
            "total_count": len(schemes),
        }
