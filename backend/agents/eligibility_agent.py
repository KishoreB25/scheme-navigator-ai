"""
Eligibility Agent
Determines if a user is eligible for schemes
"""

from typing import Dict, List


class EligibilityAgent:
    """Determines eligibility for schemes"""

    def check_eligibility(self, user_profile: Dict, scheme: Dict) -> bool:
        """Check if user is eligible for a scheme"""
        eligibility_criteria = scheme.get("eligibility", {})

        # Check age
        if eligibility_criteria.get("age_min"):
            user_age = user_profile.get("age")
            if user_age and user_age < eligibility_criteria["age_min"]:
                return False

        if eligibility_criteria.get("age_max"):
            user_age = user_profile.get("age")
            if user_age and user_age > eligibility_criteria["age_max"]:
                return False

        # Check occupation
        if eligibility_criteria.get("occupation"):
            user_occupation = user_profile.get("occupation", "").lower()
            eligible_occupations = [
                occ.lower() for occ in eligibility_criteria["occupation"]
            ]
            if user_occupation and user_occupation not in eligible_occupations:
                return False

        # Check income
        if eligibility_criteria.get("income_max"):
            user_income = user_profile.get("income")
            if user_income and user_income > eligibility_criteria["income_max"]:
                return False

        # Check gender
        if eligibility_criteria.get("gender"):
            user_gender = user_profile.get("gender", "").lower()
            required_gender = eligibility_criteria["gender"].lower()
            if user_gender and user_gender != required_gender:
                return False

        return True

    def add_eligibility_status(
        self, schemes: List[Dict], user_profile: Dict
    ) -> List[Dict]:
        """Add eligibility status to each scheme"""
        for scheme in schemes:
            scheme["eligible"] = self.check_eligibility(user_profile, scheme)

        return schemes

    def filter_eligible(self, schemes: List[Dict], user_profile: Dict) -> List[Dict]:
        """Filter only eligible schemes"""
        eligible_schemes = []

        for scheme in schemes:
            if self.check_eligibility(user_profile, scheme):
                scheme_copy = scheme.copy()
                scheme_copy["eligible"] = True
                eligible_schemes.append(scheme_copy)

        return eligible_schemes

    def process(self, schemes: List[Dict], user_profile: Dict) -> Dict:
        """Process and return eligibility information"""
        eligible_schemes = self.filter_eligible(schemes, user_profile)
        all_schemes_with_status = self.add_eligibility_status(schemes, user_profile)

        return {
            "eligible_schemes": eligible_schemes,
            "all_schemes_with_status": all_schemes_with_status,
            "eligible_count": len(eligible_schemes),
            "total_count": len(schemes),
        }
