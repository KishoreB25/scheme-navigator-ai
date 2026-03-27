"""
Query Understanding Agent
Extracts intent and entities from user queries about government schemes.
Uses keyword-based NLP with comprehensive Indian context.
"""

import re
from typing import Dict, List, Optional


class QueryAgent:
    """Understands user queries and extracts intent + entities."""

    # Intent keywords ordered by priority (more specific first)
    INTENTS = {
        "eligibility": [
            "eligible", "eligibility", "qualify", "am i", "do i", "can i",
            "qualify for", "am i eligible", "check eligibility"
        ],
        "apply": [
            "apply", "how to apply", "application", "register", "enroll",
            "sign up", "steps to apply", "application process", "how to get"
        ],
        "details": [
            "details", "information", "tell me about", "explain",
            "what is", "describe", "about"
        ],
        "search": [
            "scheme", "find", "show", "list", "available", "what",
            "which", "search", "suggest", "recommend", "benefits",
            "government", "yojana", "pradhan mantri"
        ],
    }

    # Comprehensive Indian state list
    STATES = [
        "andhra pradesh", "arunachal pradesh", "assam", "bihar",
        "chhattisgarh", "goa", "gujarat", "haryana", "himachal pradesh",
        "jharkhand", "karnataka", "kerala", "madhya pradesh",
        "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland",
        "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu",
        "telangana", "tripura", "uttar pradesh", "uttarakhand",
        "west bengal", "delhi", "jammu and kashmir", "ladakh",
        "chandigarh", "puducherry", "andaman and nicobar",
        "dadra and nagar haveli", "daman and diu", "lakshadweep",
    ]

    # Occupation keywords
    OCCUPATIONS = [
        "farmer", "student", "housewife", "unemployed", "self-employed",
        "entrepreneur", "teacher", "doctor", "engineer", "labourer",
        "laborer", "worker", "artisan", "weaver", "fisherman",
        "daily wage", "domestic worker", "vendor", "shopkeeper",
    ]

    # Known scheme name patterns for direct lookup
    SCHEME_ALIASES = {
        "pm kisan": "PMKISAN",
        "pm-kisan": "PMKISAN",
        "pmkisan": "PMKISAN",
        "kisan samman": "PMKISAN",
        "pmay": "PMAY",
        "pm awas": "PMAY",
        "awas yojana": "PMAY",
        "pradhan mantri awas": "PMAY",
        "housing scheme": "PMAY",
        "kcc": "KCC",
        "kisan credit": "KCC",
        "kisan credit card": "KCC",
        "mudra": "MUDRA",
        "mudra yojana": "MUDRA",
        "pmmy": "MUDRA",
        "mudra loan": "MUDRA",
        "beti bachao": "BBBBP",
        "beti padhao": "BBBBP",
        "bbbp": "BBBBP",
        "startup india": "STARTUP",
        "start up india": "STARTUP",
        "startup": "STARTUP",
        "jeevan jyoti": "PMJJBY",
        "pmjjby": "PMJJBY",
        "life insurance scheme": "PMJJBY",
        "suraksha bima": "PMSBY",
        "pmsby": "PMSBY",
        "accident insurance": "PMSBY",
        "atal pension": "APY",
        "apy": "APY",
        "pension yojana": "APY",
        "jan dhan": "PMJDY",
        "pmjdy": "PMJDY",
        "zero balance account": "PMJDY",
        "fasal bima": "PMFBY",
        "pmfby": "PMFBY",
        "crop insurance": "PMFBY",
        "kaushal vikas": "PMKVY",
        "pmkvy": "PMKVY",
        "skill development": "PMKVY",
        "skill training": "PMKVY",
        "nrlm": "NRLM",
        "aajeevika": "NRLM",
        "rural livelihood": "NRLM",
        "scholarship": "NSP",
        "nsp": "NSP",
        "national scholarship": "NSP",
        "ujjwala": "PMUY",
        "pmuy": "PMUY",
        "lpg connection": "PMUY",
        "gas connection": "PMUY",
        "ayushman": "ABPMJAY",
        "ayushman bharat": "ABPMJAY",
        "pmjay": "ABPMJAY",
        "jan arogya": "ABPMJAY",
        "health insurance": "ABPMJAY",
        "mgnrega": "MGNREGA",
        "nrega": "MGNREGA",
        "100 days work": "MGNREGA",
        "rural employment": "MGNREGA",
        "stand up india": "STANDUP",
        "standup india": "STANDUP",
        "swayam": "SWAYAM",
        "online courses": "SWAYAM",
        "pmegp": "PMEGP",
        "employment generation": "PMEGP",
        "matru vandana": "PMMVY",
        "pmmvy": "PMMVY",
        "maternity benefit": "PMMVY",
        "pregnant": "PMMVY",
        "swachh bharat": "SBM",
        "sbm": "SBM",
        "toilet scheme": "SBM",
        "pmgsy": "PMGSY",
        "gram sadak": "PMGSY",
        "rural road": "PMGSY",
    }

    # Gender keywords
    GENDER_KEYWORDS = {
        "male": ["male", "man", "boy", "he", "his"],
        "female": ["female", "woman", "girl", "she", "her", "women", "lady", "mother"],
    }

    # Category keywords for search
    CATEGORY_KEYWORDS = {
        "Agriculture": ["farmer", "farming", "agriculture", "crop", "kisan", "farm"],
        "Housing": ["house", "housing", "home", "awas", "shelter"],
        "Business": ["business", "loan", "enterprise", "micro", "small"],
        "Entrepreneurship": ["startup", "entrepreneur", "business", "enterprise"],
        "Women & Child": ["women", "woman", "girl", "child", "beti", "maternity"],
        "Insurance": ["insurance", "bima", "suraksha", "jeevan"],
        "Pension": ["pension", "retirement", "old age"],
        "Financial Inclusion": ["bank account", "financial", "jan dhan"],
        "Education": ["education", "scholarship", "student", "school", "college", "university"],
        "Skill Development": ["skill", "training", "kaushal", "vocational"],
        "Health": ["health", "medical", "hospital", "treatment", "ayushman"],
        "Employment": ["employment", "job", "work", "rojgar", "nrega"],
        "Rural Livelihood": ["rural", "village", "livelihood", "self help group"],
        "Health & Welfare": ["lpg", "gas", "ujjwala", "cooking fuel"],
        "Sanitation": ["toilet", "sanitation", "swachh", "cleanliness"],
    }

    def __init__(self):
        pass

    def extract_intent(self, query: str) -> str:
        """Extract intent from query with priority ordering."""
        query_lower = query.lower()

        for intent, keywords in self.INTENTS.items():
            if any(keyword in query_lower for keyword in keywords):
                return intent

        return "search"  # Default intent

    def extract_entities(self, query: str, profile: Dict = None) -> Dict:
        """Extract entities from query and merge with profile."""
        entities = {}

        # Start with profile data
        if profile:
            entities.update({k: v for k, v in profile.items() if v is not None})

        query_lower = query.lower()

        # Extract age
        age_patterns = [
            r"(\d{1,3})\s*(?:year|yr|yrs)\s*(?:old)?",
            r"age\s*(?:is|:)?\s*(\d{1,3})",
            r"i\s*am\s*(\d{1,3})",
        ]
        for pattern in age_patterns:
            match = re.search(pattern, query_lower)
            if match:
                age = int(match.group(1))
                if 0 < age < 120:
                    entities["age"] = age
                    break

        # Extract income
        income_patterns = [
            r"income\s*(?:is|:)?\s*(?:rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)\s*(?:lakh|lac|l)?\s*(?:per\s*(?:year|annum|month))?",
            r"(?:rs\.?|₹)\s*([\d,]+(?:\.\d+)?)\s*(?:per\s*(?:year|annum|month))?",
            r"earning\s*(?:rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)",
            r"salary\s*(?:is|:)?\s*(?:rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)",
        ]
        for pattern in income_patterns:
            match = re.search(pattern, query_lower)
            if match:
                income_str = match.group(1).replace(",", "")
                income = float(income_str)
                # Check if it mentions lakh
                if "lakh" in query_lower or "lac" in query_lower:
                    income = income * 100000
                if income > 120:  # Not an age
                    entities["income"] = int(income)
                    break

        # Extract general numbers (fallback for age/income)
        if "age" not in entities or "income" not in entities:
            numbers = re.findall(r"\b(\d{1,8})\b", query)
            nums = [int(n) for n in numbers]
            for n in nums:
                if "age" not in entities and 1 < n < 120:
                    entities["age"] = n
                elif "income" not in entities and n > 1000:
                    entities["income"] = n

        # Extract state names
        for state in self.STATES:
            if state in query_lower:
                entities["state"] = state.title()
                break

        # Extract occupation
        for occupation in self.OCCUPATIONS:
            if occupation in query_lower:
                entities["occupation"] = occupation
                break

        # Extract gender
        for gender, keywords in self.GENDER_KEYWORDS.items():
            if any(kw in query_lower.split() for kw in keywords):
                entities["gender"] = gender
                break

        # Extract scheme name
        for alias, scheme_id in self.SCHEME_ALIASES.items():
            if alias in query_lower:
                entities["scheme_name"] = scheme_id
                break

        # Extract categories
        matched_categories = []
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            if any(kw in query_lower for kw in keywords):
                matched_categories.append(category)
        if matched_categories:
            entities["categories"] = matched_categories

        return entities

    def process(self, query: str, profile: Dict = None) -> Dict:
        """Process query and return structured data."""
        intent = self.extract_intent(query)
        entities = self.extract_entities(query, profile)

        return {
            "original_query": query,
            "intent": intent,
            "entities": entities,
            "profile": profile or {},
        }
