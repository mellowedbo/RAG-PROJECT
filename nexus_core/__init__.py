"""
NEXUS Core — Agentic RAG Pipeline for Financial Intelligence
=============================================================

A Python package implementing the same RAG pipeline as the Next.js web app.
Importable from Google Colab notebooks after cloning the GitHub repo.

Pipeline: Ingestion -> Retrieval -> Reasoning -> Synthesis

Usage:
    from nexus_core import (
        chunk_text_recursive,
        compute_idf,
        tfidf_score,
        retrieve_tfidf,
        cosine_similarity,
        retrieve_embedding,
        configure_gemini,
        get_embeddings,
        get_single_embedding,
        get_mock_embeddings,
        VectorStore,
        generate_answer,
        scan_compliance,
        COMPLIANCE_PATTERNS,
    )
"""

__version__ = "1.0.0"
__author__ = "NEXUS"

from nexus_core.chunker import chunk_text_recursive
from nexus_core.retriever import (
    compute_idf,
    tfidf_score,
    retrieve_tfidf,
    cosine_similarity,
    retrieve_embedding,
)
from nexus_core.embeddings import (
    configure_gemini,
    get_embeddings,
    get_single_embedding,
    get_mock_embeddings,
)
from nexus_core.vectordb import VectorStore
from nexus_core.synthesizer import generate_answer
from nexus_core.compliance import scan_compliance, COMPLIANCE_PATTERNS

__all__ = [
    # Chunker
    "chunk_text_recursive",
    # Retriever
    "compute_idf",
    "tfidf_score",
    "retrieve_tfidf",
    "cosine_similarity",
    "retrieve_embedding",
    # Embeddings
    "configure_gemini",
    "get_embeddings",
    "get_single_embedding",
    "get_mock_embeddings",
    # Vector DB
    "VectorStore",
    # Synthesizer
    "generate_answer",
    # Compliance
    "scan_compliance",
    "COMPLIANCE_PATTERNS",
]
