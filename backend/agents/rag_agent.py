"""
RAG Retrieval Agent
Retrieves relevant scheme documents from FAISS vector store.
Falls back to keyword search if vector search returns insufficient results.
"""

import os
import json
from typing import Dict, List, Optional


class RAGAgent:
    """Retrieves relevant schemes using FAISS vector similarity search."""

    def __init__(self):
        """Initialize with vector store and raw scheme data."""
        self._vector_store = None
        self._embedding_engine = None
        self._schemes_db: List[Dict] = []
        self._initialized = False

    def initialize(self):
        """Lazy initialization of vector store and scheme data."""
        if self._initialized:
            return

        from data.ingestion import FAISSStore, EmbeddingEngine, SchemeIngester

        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

        # Load raw scheme data
        data_path = os.path.join(data_dir, "schemes_data.json")
        if os.path.exists(data_path):
            with open(data_path, "r", encoding="utf-8") as f:
                self._schemes_db = json.load(f)

        # Load or build vector store
        index_path = os.path.join(data_dir, "faiss_index")
        self._vector_store = FAISSStore(index_path=index_path)
        loaded = self._vector_store.load()

        if not loaded:
            print("[RAG] No pre-built FAISS index found. Building now...")
            ingester = SchemeIngester()
            ingester.build_index()
            self._vector_store = FAISSStore(index_path=index_path)
            self._vector_store.load()

        self._embedding_engine = EmbeddingEngine()
        self._initialized = True
        print(f"[RAG] Initialized with {self._vector_store.total_chunks} chunks, {len(self._schemes_db)} schemes")

    @property
    def schemes_db(self) -> List[Dict]:
        """Access raw scheme data for missed-benefits scanning."""
        if not self._initialized:
            self.initialize()
        return self._schemes_db

    def vector_search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Search vector store for relevant chunks."""
        self.initialize()

        if self._vector_store is None or self._vector_store.index is None:
            return []

        query_embedding = self._embedding_engine.embed_query(query)
        results = self._vector_store.search(query_embedding, top_k=top_k)
        return results

    def keyword_search(self, query: str, entities: Dict = None) -> List[Dict]:
        """Fallback keyword-based search against raw scheme data."""
        self.initialize()
        relevant_schemes = []
        query_lower = query.lower()

        for scheme in self._schemes_db:
            score = 0

            # Direct scheme name/ID match (highest priority)
            if entities and entities.get("scheme_name"):
                if entities["scheme_name"] == scheme.get("scheme_id"):
                    score += 20

            # Scheme name keyword match
            scheme_name_lower = scheme.get("scheme_name", "").lower()
            name_words = [w for w in scheme_name_lower.split() if len(w) > 3]
            if any(word in query_lower for word in name_words):
                score += 5

            # Category match
            category = scheme.get("category", "").lower()
            if entities and entities.get("categories"):
                for cat in entities["categories"]:
                    if cat.lower() == category:
                        score += 4

            if any(word in query_lower for word in category.split()):
                score += 3

            # Description keyword match
            desc_words = [w for w in scheme.get("description", "").lower().split() if len(w) > 5]
            desc_matches = sum(1 for word in desc_words if word in query_lower)
            score += min(desc_matches, 3)

            # Entity-based matching
            if entities:
                elig = scheme.get("eligibility_criteria", {})

                # Occupation match
                if entities.get("occupation") and elig.get("occupation"):
                    if entities["occupation"].lower() in [o.lower() for o in elig["occupation"]]:
                        score += 6

                # Income match  
                if entities.get("income") is not None and elig.get("income_max"):
                    if entities["income"] <= elig["income_max"]:
                        score += 3

                # Age match
                if entities.get("age") is not None:
                    age_min = elig.get("age_min") or 0
                    age_max = elig.get("age_max") or 150
                    if age_min <= entities["age"] <= age_max:
                        score += 3

                # State match
                if entities.get("state"):
                    scheme_state = scheme.get("state", "").lower()
                    if scheme_state == "all india" or entities["state"].lower() in scheme_state:
                        score += 2

                # Gender match
                if entities.get("gender") and elig.get("gender"):
                    if entities["gender"].lower() == elig["gender"].lower():
                        score += 4

            if score > 0:
                scheme_copy = scheme.copy()
                scheme_copy["relevance_score"] = score
                relevant_schemes.append(scheme_copy)

        relevant_schemes.sort(key=lambda x: x["relevance_score"], reverse=True)
        return relevant_schemes[:10]

    def _chunks_to_schemes(self, chunks: List[Dict]) -> List[Dict]:
        """Convert vector search chunks back to full scheme objects."""
        seen_scheme_ids = set()
        schemes = []

        for chunk in chunks:
            scheme_id = chunk["metadata"].get("scheme_id", "")
            if scheme_id in seen_scheme_ids:
                continue
            seen_scheme_ids.add(scheme_id)

            # Find the full scheme in raw data
            for raw_scheme in self._schemes_db:
                if raw_scheme.get("scheme_id") == scheme_id:
                    scheme_copy = raw_scheme.copy()
                    scheme_copy["relevance_score"] = chunk.get("score", 0)
                    scheme_copy["retrieved_chunks"] = [
                        c for c in chunks
                        if c["metadata"].get("scheme_id") == scheme_id
                    ]
                    schemes.append(scheme_copy)
                    break

        return schemes

    def retrieve(self, query: str, entities: Dict = None, top_k: int = 5) -> List[Dict]:
        """
        Main retrieval method: keyword search (entity-aware) + vector search.
        Keyword search is primary because it understands occupation/category/state.
        Vector search augments with semantic matches.
        """
        self.initialize()

        # Step 1: Keyword search (entity-aware, high precision)
        keyword_results = self.keyword_search(query, entities)

        # Step 2: Vector search (semantic, high recall)
        vector_results = self.vector_search(query, top_k=top_k * 2)
        schemes_from_vectors = self._chunks_to_schemes(vector_results)

        # Step 3: Merge — keyword results have priority, vector fills gaps
        seen_ids = set()
        merged = []

        # Add keyword results first (they have entity-based scoring)
        for ks in keyword_results:
            sid = ks.get("scheme_id")
            if sid not in seen_ids:
                # Boost keyword scores slightly to maintain priority
                ks["relevance_score"] = ks.get("relevance_score", 0) + 1
                merged.append(ks)
                seen_ids.add(sid)

        # Add vector results that weren't in keyword results
        for vs in schemes_from_vectors:
            sid = vs.get("scheme_id")
            if sid not in seen_ids:
                merged.append(vs)
                seen_ids.add(sid)

        # Sort by relevance
        merged.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        return merged[:top_k]

    def process(self, query: str, entities: Dict = None) -> Dict:
        """Process and return retrieved schemes."""
        schemes = self.retrieve(query, entities)

        return {
            "query": query,
            "retrieved_schemes": schemes,
            "count": len(schemes),
            "source": "FAISS + keyword hybrid",
        }
