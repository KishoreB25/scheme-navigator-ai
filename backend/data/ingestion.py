"""
Data Ingestion Pipeline for PolicyGPT Bharat
Handles: JSON loading → Text chunking → Embedding → FAISS vector store
"""

import json
import os
import re
import pickle
import numpy as np
from typing import List, Dict, Tuple, Optional


class TextChunker:
    """Chunks scheme text into 300-500 token segments with overlap."""

    def __init__(self, chunk_size: int = 400, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def _estimate_tokens(self, text: str) -> int:
        """Rough token count: ~0.75 words per token for English."""
        return int(len(text.split()) / 0.75)

    def _chunk_text(self, text: str) -> List[str]:
        """Split text into chunks of approximately chunk_size tokens."""
        words = text.split()
        chunks = []
        # Approximate words per chunk (1 token ≈ 0.75 words)
        words_per_chunk = int(self.chunk_size * 0.75)
        overlap_words = int(self.chunk_overlap * 0.75)

        if len(words) <= words_per_chunk:
            return [text]

        start = 0
        while start < len(words):
            end = start + words_per_chunk
            chunk = " ".join(words[start:end])
            chunks.append(chunk)
            start = end - overlap_words
            if start >= len(words):
                break

        return chunks

    def chunk_scheme(self, scheme: Dict) -> List[Dict]:
        """Create chunks from a scheme with metadata."""
        chunks = []

        # Build full text from all scheme fields
        full_text = self._build_scheme_text(scheme)
        text_chunks = self._chunk_text(full_text)

        for i, chunk_text in enumerate(text_chunks):
            chunks.append({
                "text": chunk_text,
                "metadata": {
                    "scheme_id": scheme.get("scheme_id", ""),
                    "scheme_name": scheme.get("scheme_name", ""),
                    "category": scheme.get("category", ""),
                    "state": scheme.get("state", ""),
                    "official_link": scheme.get("official_link", ""),
                    "chunk_index": i,
                    "total_chunks": len(text_chunks),
                },
            })

        return chunks

    def _build_scheme_text(self, scheme: Dict) -> str:
        """Build a single text representation of a scheme."""
        parts = []
        parts.append(f"Scheme Name: {scheme.get('scheme_name', '')}")
        parts.append(f"Category: {scheme.get('category', '')}")
        parts.append(f"Description: {scheme.get('description', '')}")
        parts.append(f"Eligibility: {scheme.get('eligibility', '')}")
        parts.append(f"Benefits: {scheme.get('benefits', '')}")
        parts.append(f"Documents Required: {scheme.get('documents_required', '')}")
        parts.append(f"Application Process: {scheme.get('application_process', '')}")
        parts.append(f"Official Link: {scheme.get('official_link', '')}")
        parts.append(f"State: {scheme.get('state', '')}")
        if scheme.get("ministry"):
            parts.append(f"Ministry: {scheme.get('ministry', '')}")
        return "\n".join(parts)


class EmbeddingEngine:
    """Generates embeddings using sentence-transformers."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None

    @property
    def model(self):
        """Lazy-load the embedding model."""
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(self.model_name)
            except ImportError:
                raise ImportError(
                    "sentence-transformers is required. "
                    "Install with: pip install sentence-transformers"
                )
        return self._model

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for a list of texts."""
        embeddings = self.model.encode(texts, show_progress_bar=True, normalize_embeddings=True)
        return np.array(embeddings, dtype=np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        """Generate embedding for a single query."""
        embedding = self.model.encode([query], normalize_embeddings=True)
        return np.array(embedding, dtype=np.float32)

    @property
    def dimension(self) -> int:
        """Return embedding dimension."""
        return self.model.get_sentence_embedding_dimension()


class FAISSStore:
    """FAISS vector store for scheme chunks."""

    def __init__(self, index_path: str = None):
        self.index_path = index_path or os.path.join(
            os.path.dirname(__file__), "faiss_index"
        )
        self.index = None
        self.chunks_metadata: List[Dict] = []
        self.chunks_text: List[str] = []

    def build_index(self, embeddings: np.ndarray, chunks: List[Dict]):
        """Build FAISS index from embeddings and chunk metadata."""
        try:
            import faiss
        except ImportError:
            raise ImportError(
                "faiss-cpu is required. Install with: pip install faiss-cpu"
            )

        dimension = embeddings.shape[1]
        # Use Inner Product index (since embeddings are normalized, this = cosine similarity)
        self.index = faiss.IndexFlatIP(dimension)
        self.index.add(embeddings)

        self.chunks_text = [c["text"] for c in chunks]
        self.chunks_metadata = [c["metadata"] for c in chunks]

    def save(self):
        """Save FAISS index and metadata to disk."""
        try:
            import faiss
        except ImportError:
            raise ImportError("faiss-cpu is required.")

        os.makedirs(self.index_path, exist_ok=True)

        faiss.write_index(self.index, os.path.join(self.index_path, "index.faiss"))

        with open(os.path.join(self.index_path, "metadata.pkl"), "wb") as f:
            pickle.dump(
                {
                    "chunks_text": self.chunks_text,
                    "chunks_metadata": self.chunks_metadata,
                },
                f,
            )

    def load(self) -> bool:
        """Load FAISS index from disk. Returns True if successful."""
        try:
            import faiss
        except ImportError:
            return False

        index_file = os.path.join(self.index_path, "index.faiss")
        meta_file = os.path.join(self.index_path, "metadata.pkl")

        if not os.path.exists(index_file) or not os.path.exists(meta_file):
            return False

        self.index = faiss.read_index(index_file)

        with open(meta_file, "rb") as f:
            data = pickle.load(f)
            self.chunks_text = data["chunks_text"]
            self.chunks_metadata = data["chunks_metadata"]

        return True

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Dict]:
        """Search for similar chunks."""
        if self.index is None:
            return []

        scores, indices = self.index.search(query_embedding, top_k)
        results = []

        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self.chunks_text):
                continue
            results.append({
                "text": self.chunks_text[idx],
                "metadata": self.chunks_metadata[idx],
                "score": float(score),
            })

        return results

    @property
    def total_chunks(self) -> int:
        """Return total number of indexed chunks."""
        return self.index.ntotal if self.index else 0


class SchemeIngester:
    """
    Complete ingestion pipeline:
    JSON schemes → Chunk → Embed → FAISS index
    """

    def __init__(
        self,
        data_path: str = None,
        index_path: str = None,
        embedding_model: str = "all-MiniLM-L6-v2",
        chunk_size: int = 400,
        chunk_overlap: int = 50,
    ):
        data_dir = os.path.dirname(__file__)
        self.data_path = data_path or os.path.join(data_dir, "schemes_data.json")
        self.index_path = index_path or os.path.join(data_dir, "faiss_index")

        self.chunker = TextChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        self.embedding_engine = EmbeddingEngine(model_name=embedding_model)
        self.vector_store = FAISSStore(index_path=self.index_path)

        self.schemes_raw: List[Dict] = []

    def load_schemes(self) -> List[Dict]:
        """Load scheme data from JSON file."""
        with open(self.data_path, "r", encoding="utf-8") as f:
            self.schemes_raw = json.load(f)
        return self.schemes_raw

    def build_index(self) -> int:
        """
        Full pipeline: load → chunk → embed → index → save.
        Returns the number of chunks indexed.
        """
        # Load
        schemes = self.load_schemes()
        print(f"[Ingestion] Loaded {len(schemes)} schemes")

        # Chunk
        all_chunks = []
        for scheme in schemes:
            chunks = self.chunker.chunk_scheme(scheme)
            all_chunks.extend(chunks)
        print(f"[Ingestion] Created {len(all_chunks)} chunks")

        # Embed
        texts = [c["text"] for c in all_chunks]
        print(f"[Ingestion] Generating embeddings for {len(texts)} chunks...")
        embeddings = self.embedding_engine.embed_texts(texts)
        print(f"[Ingestion] Embeddings shape: {embeddings.shape}")

        # Build FAISS index
        self.vector_store.build_index(embeddings, all_chunks)
        print(f"[Ingestion] FAISS index built with {self.vector_store.total_chunks} vectors")

        # Save
        self.vector_store.save()
        print(f"[Ingestion] Index saved to {self.index_path}")

        return len(all_chunks)

    def get_all_schemes(self) -> List[Dict]:
        """Return all raw scheme data (for eligibility scanning)."""
        if not self.schemes_raw:
            self.load_schemes()
        return self.schemes_raw


if __name__ == "__main__":
    ingester = SchemeIngester()
    count = ingester.build_index()
    print(f"\n✅ Successfully indexed {count} chunks from {len(ingester.schemes_raw)} schemes")
