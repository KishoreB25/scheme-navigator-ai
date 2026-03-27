"""
Action Agent
Provides application steps and actions for schemes
"""

from typing import Dict, List


class ActionAgent:
    """Provides action steps for schemes"""

    STEPS_DB = {
        "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)": {
            "steps": [
                "Visit the official website: pmkisan.gov.in",
                "Click on 'New Farmer Registration'",
                "Enter your Aadhaar number and state",
                "Fill in the required details (name, bank details, etc.)",
                "Submit the form",
                "Verify your details",
                "Receive confirmation on registered mobile number",
            ],
            "documents": [
                "Aadhaar Card",
                "Bank Account Details",
                "Land Records (optional)",
            ],
            "timeline": "Approval within 15-20 days",
        },
        "PM-Awas Yojana (PMAY)": {
            "steps": [
                "Visit pmaymis.gov.in",
                "Register yourself on the portal",
                "Submit your application with required documents",
                "Wait for technical verification",
                "Complete the inspection",
                "Receive fund release approval",
                "Get disbursement of subsidy",
            ],
            "documents": [
                "Aadhaar Card",
                "Proof of income",
                "Property documents",
                "Bank account statement",
            ],
            "timeline": "6-12 months",
        },
        "Kisan Credit Card (KCC)": {
            "steps": [
                "Visit your bank branch",
                "Collect Form KCC-A",
                "Fill the form with required details",
                "Attach identity proof and land records",
                "Submit to the bank",
                "Bank conducts verification",
                "Receive KCC card and cheque book",
            ],
            "documents": [
                "Identity Proof (Aadhaar/PAN)",
                "Land records",
                "Bank passbook",
                "Photo",
            ],
            "timeline": "5-10 days",
        },
    }

    def get_steps(self, scheme_name: str) -> Dict:
        """Get action steps for a scheme"""
        if scheme_name in self.STEPS_DB:
            return self.STEPS_DB[scheme_name]

        return {
            "steps": [
                "Visit the official government portal for this scheme",
                "Create an account or login",
                "Fill the application form",
                "Upload required documents",
                "Submit the application",
                "Track your application status",
            ],
            "documents": ["Aadhaar Card", "Bank Account Details"],
            "timeline": "Varies",
        }

    def process(self, schemes: List[Dict]) -> Dict:
        """Process and return action steps"""
        action_items = []

        for scheme in schemes:
            scheme_name = scheme.get("name")
            steps = self.get_steps(scheme_name)

            action_items.append({
                "scheme_name": scheme_name,
                "application_steps": steps["steps"],
                "required_documents": steps["documents"],
                "timeline": steps["timeline"],
            })

        return {
            "actions": action_items,
            "count": len(action_items),
        }
