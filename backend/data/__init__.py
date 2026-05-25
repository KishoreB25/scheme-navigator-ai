"""
Data ingestion and vector store module for PolicyGPT Bharat
[Migration Note] ChromaDB replaces FAISS as the vector store backend.
"""

from .ingestion import SchemeIngester, ChromaVectorStore

__all__ = ["SchemeIngester", "ChromaVectorStore"]
