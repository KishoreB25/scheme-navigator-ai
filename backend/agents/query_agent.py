"""
Query Understanding Agent
Extracts intent and entities from user queries
"""

import re
from typing import Dict, List


class QueryAgent:
    """Understands user queries and extracts intent + entities"""

    INTENTS = {
        "search": ["scheme", "eligibility", "find", "show", "list", "available", "what", "which"],
        "eligibility": ["eligible", "qualify", "am i", "do i", "can i", "qualify for"],
        "apply": ["apply", "how to apply", "application", "register", "enroll", "steps"],
        "details": ["details", "information", "tell", "explain", "about"],
    }

    def __init__(self):
        self.entities = [
            "age",
            "income",
            "state",
            "occupation",
            "gender",
            "education",
            "caste",
        ]

    def extract_intent(self, query: str) -> str:
        """Extract intent from query"""
        query_lower = query.lower()

        for intent, keywords in self.INTENTS.items():
            if any(keyword in query_lower for keyword in keywords):
                return intent

        return "search"  # Default intent

    def extract_entities(self, query: str, profile: Dict = None) -> Dict:
        """Extract entities from query and profile"""
        entities = {}

        # Extract from query
        if profile:
            entities.update(profile)

        # Try to extract numbers (age, income)
        numbers = re.findall(r"\d+(?:,\d{3})*(?:\.\d+)?", query)
        if numbers:
            # First number might be age, second might be income
            if len(numbers) >= 1:
                # Convert to float first to handle decimals, then to int
                first_num_float = float(numbers[0].replace(",", ""))
                first_num = int(first_num_float)
                if first_num < 120:
                    entities["age"] = first_num
                else:
                    entities["income"] = first_num

            if len(numbers) >= 2:
                second_num_float = float(numbers[1].replace(",", ""))
                entities["income"] = int(second_num_float)

        # Extract state names (simple check)
        states = [
            "maharashtra",
            "tamil nadu",
            "karnataka",
            "delhi",
            "uttar pradesh",
            "rajasthan",
            "bihar",
            "west bengal",
            "punjab",
            "haryana",
            "andhra pradesh",
            "telangana",
            "kerala",
            "goa",
            "assam",
            "gujarat",
            "jharkhand",
        ]
        query_lower = query.lower()
        for state in states:
            if state in query_lower:
                entities["state"] = state.title()
                break

        # Extract occupation
        occupations = [
            "farmer",
            "student",
            "housewife",
            "unemployed",
            "self-employed",
            "entrepreneur",
        ]
        for occupation in occupations:
            if occupation in query_lower:
                entities["occupation"] = occupation
                break

        return entities

    def process(self, query: str, profile: Dict = None) -> Dict:
        """Process query and return structured data"""
        intent = self.extract_intent(query)
        entities = self.extract_entities(query, profile)

        return {
            "original_query": query,
            "intent": intent,
            "entities": entities,
            "profile": profile or {},
        }
