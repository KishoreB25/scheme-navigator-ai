"""
Data Ingestion Pipeline for PolicyGPT Bharat
Handles: JSON loading → Text chunking → Embedding → ChromaDB vector store

[Migration Note] Replaced FAISS with ChromaDB for persistent vector storage.
ChromaDB provides built-in persistence, metadata filtering, and collection management
without requiring manual index save/load or pickle-based metadata serialization.
"""
# pyrefly: ignore [missing-import]
import chromadb
import json
import os
import hashlib
import sys
import numpy as np
from typing import List, Dict, Optional

# Ensure parent directory (backend/) is in sys.path when running this file directly
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)



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


class GoogleEmbeddingEngine:
    """Generates embeddings using Google's Embedding API.
    
    Benefits:
    - No heavy dependencies (torch, transformers)
    - API-based: no local model loading
    - 768-dimensional embeddings (compatible with all-MiniLM-L6-v2)
    - Requires GOOGLE_API_KEY in environment
    """

    EMBEDDING_MODEL = "models/gemini-embedding-2"
    EMBEDDING_DIM = 3072

    def __init__(self):
        self._client = None
        self._initialize()

    def _initialize(self):
        """Initialize Google Generative AI client."""
        from config.settings import settings
        
        if not settings.google_api_key:
            raise ValueError(
                "[Embeddings] GOOGLE_API_KEY not found in environment. "
                "Set it in .env: GOOGLE_API_KEY=your_key"
            )
        
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.google_api_key)
            self._client = genai
            print("[Embeddings] Google Generative AI initialized successfully")
        except ImportError:
            raise ImportError(
                "google-generativeai is required. "
                "Install with: pip install google-generativeai"
            )

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for a list of texts."""
        embeddings = []
        
        # Process in batches to avoid rate limits
        batch_size = 100
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            print(f"[Embeddings] Embedding batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")
            
            for text in batch:
                try:
                    response = self._client.embed_content(
                        model=self.EMBEDDING_MODEL,
                        content=text,
                        task_type="RETRIEVAL_DOCUMENT",
                    )
                    embeddings.append(response["embedding"])
                except Exception as e:
                    print(f"[Embeddings] Error embedding text: {e}")
                    # Return zero vector as fallback
                    embeddings.append([0.0] * self.EMBEDDING_DIM)
        
        return np.array(embeddings, dtype=np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        """Generate embedding for a single query."""
        try:
            response = self._client.embed_content(
                model=self.EMBEDDING_MODEL,
                content=query,
                task_type="RETRIEVAL_QUERY",
            )
            embedding = response["embedding"]
        except Exception as e:
            error_msg = str(e)
            print(f"[Embeddings] Error embedding query: {error_msg}")
            
            # If model not found, try to list available models
            if "not found" in error_msg.lower() or "not supported" in error_msg.lower():
                try:
                    print("[Embeddings] Listing available embedding models...")
                    available = self._client.list_models()
                    for model in available:
                        if "embed" in model.name.lower():
                            print(f"  - {model.name}")
                except:
                    pass
            
            embedding = [0.0] * self.EMBEDDING_DIM
        
        return np.array([embedding], dtype=np.float32)

    @property
    def dimension(self) -> int:
        """Return embedding dimension."""
        return self.EMBEDDING_DIM


# Legacy alias for backwards compatibility
class EmbeddingEngine(GoogleEmbeddingEngine):
    """Wrapper for GoogleEmbeddingEngine. 
    
    Now uses Google Generative AI API instead of local sentence-transformers.
    This removes the torch/transformers dependency overhead.
    """
    pass


# =============================================================================
# [Migration] ChromaVectorStore replaces FAISSStore
# Key differences:
#   - Uses chromadb.PersistentClient for automatic disk persistence (no manual save/load)
#   - Collection-based organization with metadata filtering support
#   - Deterministic document IDs prevent duplicates on re-ingestion
#   - Built-in distance metrics (cosine similarity via normalized embeddings)
# =============================================================================


class ChromaVectorStore:
    """ChromaDB-backed persistent vector store for scheme chunks.
    
    Replaces FAISSStore with identical external API:
    - add_documents() replaces build_index()
    - search() returns same [{text, metadata, score}] format
    - total_chunks property works identically
    - Persistence is automatic (no save/load methods needed)
    """

    def __init__(self, persist_dir: str = None, collection_name: str = "bharat_policies"):
        """Initialize ChromaDB persistent client and collection.
        
        Args:
            persist_dir: Directory for ChromaDB persistent storage.
                         Defaults to 'data/chroma_db' relative to this file.
            collection_name: Name of the ChromaDB collection.
        """
        

        self.persist_dir = persist_dir or os.path.join(
            os.path.dirname(__file__), "chroma_db"
        )
        self.collection_name = collection_name

        # Create persistent client — data survives restarts automatically
        os.makedirs(self.persist_dir, exist_ok=True)
        self._client = chromadb.PersistentClient(path=self.persist_dir)

        # Get or create the collection
        # Using cosine distance since our embeddings are L2-normalized
        self._collection = self._client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )

        # ── Self-healing: Re-index if embedding dimension mismatch ──
        if self._collection.count() > 0:
            try:
                peek_data = self._collection.peek(limit=1)
                if peek_data and peek_data.get("embeddings") is not None and len(peek_data["embeddings"]) > 0:
                    first_emb = peek_data["embeddings"][0]
                    if len(first_emb) != 3072:
                        print(f"[ChromaDB] Collection dimension ({len(first_emb)}) mismatch. Expected: 3072. Re-indexing...")
                        self.delete_collection()
            except Exception as e:
                print(f"[ChromaDB] Preflight check error: {e}")

    def _generate_doc_id(self, scheme_id: str, chunk_index: int) -> str:
        """Generate a deterministic document ID to prevent duplicates.
        
        Using scheme_id + chunk_index ensures that re-ingesting the same
        data doesn't create duplicate entries in the collection.
        """
        raw = f"{scheme_id}_chunk_{chunk_index}"
        return hashlib.md5(raw.encode()).hexdigest()

    def add_documents(self, embeddings: np.ndarray, chunks: List[Dict]):
        """Add document chunks with embeddings and metadata to the collection.
        
        Args:
            embeddings: numpy array of shape (n_chunks, embedding_dim)
            chunks: list of dicts with 'text' and 'metadata' keys
        
        [Migration Note] Replaces FAISSStore.build_index(). ChromaDB handles
        indexing internally — no need to manually build FAISS IndexFlatIP.
        """
        if len(chunks) == 0:
            print("[ChromaDB] No chunks to add")
            return

        ids = []
        documents = []
        metadatas = []
        embedding_list = embeddings.tolist()

        for i, chunk in enumerate(chunks):
            metadata = chunk["metadata"]
            doc_id = self._generate_doc_id(
                metadata.get("scheme_id", f"unknown_{i}"),
                metadata.get("chunk_index", i)
            )
            ids.append(doc_id)
            documents.append(chunk["text"])

            # ChromaDB metadata values must be str, int, float, or bool
            # Convert all metadata values to compatible types
            clean_metadata = {}
            for key, value in metadata.items():
                if value is None:
                    clean_metadata[key] = ""
                elif isinstance(value, (str, int, float, bool)):
                    clean_metadata[key] = value
                else:
                    clean_metadata[key] = str(value)
            metadatas.append(clean_metadata)

        # Upsert to handle re-ingestion gracefully (idempotent)
        # Process in batches to avoid memory issues with large datasets
        batch_size = 500
        for start in range(0, len(ids), batch_size):
            end = min(start + batch_size, len(ids))
            self._collection.upsert(
                ids=ids[start:end],
                embeddings=embedding_list[start:end],
                documents=documents[start:end],
                metadatas=metadatas[start:end],
            )

        print(f"[ChromaDB] Upserted {len(ids)} documents into '{self.collection_name}'")

    def search(
        self,
        query_embedding: np.ndarray,
        top_k: int = 5,
        where: Optional[Dict] = None,
    ) -> List[Dict]:
        """Search for similar chunks using cosine similarity.
        
        Args:
            query_embedding: numpy array of shape (1, embedding_dim)
            top_k: number of results to return
            where: optional metadata filter dict, e.g. {"state": "Tamil Nadu"}
        
        Returns:
            List of dicts with 'text', 'metadata', and 'score' keys.
            Score is cosine similarity (higher = more similar).
        
        [Migration Note] Replaces FAISSStore.search(). Return format is
        identical so RAG agent requires no changes to result handling.
        """
        if self._collection.count() == 0:
            return []

        # Clamp top_k to available documents
        available = self._collection.count()
        effective_k = min(top_k, available)

        query_params = {
            "query_embeddings": query_embedding.tolist(),
            "n_results": effective_k,
            "include": ["documents", "metadatas", "distances"],
        }

        if where:
            query_params["where"] = where

        results = self._collection.query(**query_params)

        # Convert ChromaDB results to the same format as old FAISSStore
        search_results = []
        if results and results["documents"] and results["documents"][0]:
            for doc, metadata, distance in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            ):
                # ChromaDB returns cosine distance; convert to similarity score
                # cosine_similarity = 1 - cosine_distance
                similarity_score = 1.0 - distance

                search_results.append({
                    "text": doc,
                    "metadata": metadata,
                    "score": float(similarity_score),
                })

        return search_results

    def delete_collection(self):
        """Delete the entire collection. Useful for re-indexing from scratch."""
        

        self._client.delete_collection(self.collection_name)
        # Recreate empty collection
        self._collection = self._client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        print(f"[ChromaDB] Collection '{self.collection_name}' deleted and recreated")

    @property
    def total_chunks(self) -> int:
        """Return total number of indexed chunks."""
        return self._collection.count()

    @property
    def has_data(self) -> bool:
        """Check if the collection has any documents indexed."""
        return self._collection.count() > 0


class SchemeIngester:
    """
    Complete ingestion pipeline:
    JSON schemes → Chunk → Embed → ChromaDB collection

    [Migration Note] Replaced FAISS index building with ChromaDB upsert.
    The pipeline flow is identical: load → chunk → embed → store.
    ChromaDB handles persistence automatically — no manual save step.
    """

    def __init__(
        self,
        data_path: str = None,
        persist_dir: str = None,
        collection_name: str = "bharat_policies",
        embedding_model: str = "all-MiniLM-L6-v2",
        chunk_size: int = 400,
        chunk_overlap: int = 50,
    ):
        data_dir = os.path.dirname(__file__)
        self.data_path = data_path or os.path.join(data_dir, "schemes_data.json")
        # [Migration] Changed from faiss_index dir to chroma_db dir
        self.persist_dir = persist_dir or os.path.join(data_dir, "chroma_db")

        self.chunker = TextChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        # Note: embedding_model parameter ignored — using Google Embedding API
        self.embedding_engine = EmbeddingEngine()
        self.vector_store = ChromaVectorStore(
            persist_dir=self.persist_dir,
            collection_name=collection_name,
        )

        self.schemes_raw: List[Dict] = []

    def load_schemes(self) -> List[Dict]:
        """Load scheme data from JSON file."""
        with open(self.data_path, "r", encoding="utf-8") as f:
            self.schemes_raw = json.load(f)
        return self.schemes_raw

    def build_index(self) -> int:
        """
        Full pipeline: load → chunk → embed → store in ChromaDB.
        Returns the number of chunks indexed.

        [Migration Note] Replaces FAISS index building. Key differences:
        - Uses ChromaVectorStore.add_documents() instead of FAISSStore.build_index()
        - No manual save() call needed — ChromaDB auto-persists
        - Upsert semantics prevent duplicate entries on re-run
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

        # Store in ChromaDB (replaces FAISS index build + save)
        self.vector_store.add_documents(embeddings, all_chunks)
        print(f"[Ingestion] ChromaDB collection populated with {self.vector_store.total_chunks} vectors")

        return len(all_chunks)

    def get_all_schemes(self) -> List[Dict]:
        """Return all raw scheme data (for eligibility scanning)."""
        if not self.schemes_raw:
            self.load_schemes()
        return self.schemes_raw


if __name__ == "__main__":
    ingester = SchemeIngester()
    count = ingester.build_index()
    print(f"\nSuccessfully indexed {count} chunks from {len(ingester.schemes_raw)} schemes")
