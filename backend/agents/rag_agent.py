"""
RAG Retrieval Agent
Retrieves relevant scheme documents from vector store
"""

from typing import Dict, List


class RAGAgent:
    """Retrieves relevant schemes based on query"""

    def __init__(self):
        """Initialize with mock scheme database"""
        self.schemes_db = [
            {
                "id": 1,
                "name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
                "category": "Agriculture",
                "description": "An initiative by the government of India in which all farmers will get up to ₹6,000 per year as minimum income support.",
                "eligibility": {
                    "occupation": ["farmer"],
                    "age_min": 18,
                    "age_max": None,
                    "income_max": None,
                },
                "benefits": [
                    "₹6,000 per year income support",
                    "Direct benefit transfer (DBT) to bank account",
                    "Financial independence",
                ],
            },
            {
                "id": 2,
                "name": "PM-Awas Yojana (PMAY)",
                "category": "Housing",
                "description": "A government scheme to provide financial support for construction and improvement of houses for underprivileged urban poor households.",
                "eligibility": {
                    "occupation": None,
                    "age_min": 18,
                    "age_max": None,
                    "income_max": 300000,
                },
                "benefits": [
                    "Subsidy up to ₹2,67,000",
                    "Home loan assistance",
                    "Construction support",
                ],
            },
            {
                "id": 3,
                "name": "Kisan Credit Card (KCC)",
                "category": "Agriculture",
                "description": "A credit scheme for farmers to meet their short-term and medium-term credit requirements engaged in agriculture and allied activities.",
                "eligibility": {
                    "occupation": ["farmer"],
                    "age_min": 18,
                    "age_max": 75,
                    "income_max": None,
                },
                "benefits": [
                    "Easy access to credit",
                    "Low interest rates",
                    "Flexible repayment",
                ],
            },
            {
                "id": 4,
                "name": "Pradhan Mantri Mudra Yojana",
                "category": "Business",
                "description": "A scheme to provide loans up to ₹10 lakhs to non-corporate, non-farm small/micro enterprises.",
                "eligibility": {
                    "occupation": ["self-employed", "entrepreneur"],
                    "age_min": 18,
                    "age_max": None,
                    "income_max": None,
                },
                "benefits": [
                    "Loan up to ₹10 lakhs",
                    "No collateral required",
                    "Flexible repayment options",
                ],
            },
            {
                "id": 5,
                "name": "Beti Bachao Beti Padhao",
                "category": "Women",
                "description": "A government scheme to promote education and improve efficiency of welfare services meant for girls.",
                "eligibility": {
                    "occupation": None,
                    "age_min": 0,
                    "age_max": 18,
                    "gender": "Female",
                },
                "benefits": [
                    "Educational support",
                    "Financial assistance",
                    "Skill development",
                ],
            },
            {
                "id": 6,
                "name": "Startup India",
                "category": "Entrepreneurship",
                "description": "An initiative to foster entrepreneurship and accelerate job creation.",
                "eligibility": {
                    "occupation": ["entrepreneur"],
                    "age_min": 18,
                    "age_max": None,
                },
                "benefits": [
                    "Tax benefits",
                    "Mentor support",
                    "Easier compliance",
                ],
            },
        ]

    def retrieve(self, query: str, entities: Dict = None) -> List[Dict]:
        """Retrieve relevant schemes based on query and entities"""
        relevant_schemes = []

        # Simple keyword matching
        query_lower = query.lower()

        for scheme in self.schemes_db:
            score = 0

            # Keyword matching
            if any(
                keyword in query_lower
                for keyword in scheme["name"].lower().split()
                if len(keyword) > 3
            ):
                score += 3

            if any(
                keyword in query_lower
                for keyword in scheme["category"].lower().split()
            ):
                score += 2

            if any(keyword in query_lower for keyword in scheme["description"].lower().split() if len(keyword) > 4):
                score += 1

            # Entity matching
            if entities:
                if (
                    "occupation" in entities
                    and entities["occupation"] is not None
                    and scheme["eligibility"].get("occupation")
                    and entities["occupation"].lower()
                    in [occ.lower() for occ in scheme["eligibility"]["occupation"]]
                ):
                    score += 5

                if "income" in entities and entities["income"] is not None and scheme["eligibility"].get("income_max"):
                    if entities["income"] <= scheme["eligibility"]["income_max"]:
                        score += 3

                if "age" in entities and entities["age"] is not None:
                    age_min = scheme["eligibility"].get("age_min") or 0
                    age_max = scheme["eligibility"].get("age_max") or 150
                    if age_min <= entities["age"] <= age_max:
                        score += 3

            scheme_copy = scheme.copy()
            scheme_copy["relevance_score"] = score
            if score > 0:
                relevant_schemes.append(scheme_copy)

        # Sort by relevance score
        relevant_schemes.sort(key=lambda x: x["relevance_score"], reverse=True)

        return relevant_schemes[:5]  # Return top 5

    def process(self, query: str, entities: Dict = None) -> Dict:
        """Process and return retrieved schemes"""
        schemes = self.retrieve(query, entities)

        return {
            "query": query,
            "retrieved_schemes": schemes,
            "count": len(schemes),
        }
