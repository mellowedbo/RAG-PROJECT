"""
NEXUS — Embeddings Client
===========================
Gemini text-embedding-004 via google-generativeai.
Simulation mode returns deterministic mock vectors.

Faithful port of the TypeScript embeddings from src/lib/embeddings.ts.
"""

from __future__ import annotations

import math
from typing import Optional

# ─── Module-level state ───────────────────────────────────────

_gemini_configured = False
_api_key: Optional[str] = None

_EMBEDDING_DIM = 768


# ─── Configuration ────────────────────────────────────────────

def configure_gemini(api_key: str) -> None:
    """Configure the Google Generative AI SDK with the given API key."""
    global _gemini_configured, _api_key  # noqa: PLW0603
    _api_key = api_key
    try:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=api_key)
        _gemini_configured = True
    except ImportError:
        _gemini_configured = False


# ─── Real Embeddings ──────────────────────────────────────────

def get_embeddings(
    texts: list[str],
    model: str = "text-embedding-004",
) -> list[list[float]]:
    """
    Get real embeddings via the Gemini ``batchEmbedContents`` API.

    Falls back to mock embeddings on any failure.

    Args:
        texts: List of text strings to embed.
        model: Gemini embedding model name.

    Returns:
        List of embedding vectors (one per input text).
    """
    if not _gemini_configured or not _api_key:
        return get_mock_embeddings(texts)

    try:
        import google.generativeai as genai  # type: ignore

        results: list[list[float]] = []
        batch_size = 20

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            try:
                response = genai.embed_content(
                    model=f"models/{model}",
                    content=batch,
                    task_type="retrieval_document",
                )
                results.extend(response["embedding"])
            except Exception:
                # Fallback to mock for this batch
                results.extend(get_mock_embeddings(batch))

        return results

    except ImportError:
        return get_mock_embeddings(texts)


def get_single_embedding(
    text: str,
    model: str = "text-embedding-004",
) -> list[float]:
    """
    Get a single embedding vector for a query string.

    Args:
        text:  The text to embed.
        model: Gemini embedding model name.

    Returns:
        A single embedding vector.
    """
    if not _gemini_configured or not _api_key:
        return get_mock_embeddings([text])[0]

    try:
        import google.generativeai as genai  # type: ignore

        response = genai.embed_content(
            model=f"models/{model}",
            content=text,
            task_type="retrieval_query",
        )
        return response["embedding"]

    except (ImportError, Exception):
        return get_mock_embeddings([text])[0]


# ─── Mock Embeddings (Simulation) ─────────────────────────────

def get_mock_embeddings(texts: list[str], dim: int = _EMBEDDING_DIM) -> list[list[float]]:
    """
    Generate deterministic pseudo-embeddings for simulation.

    Uses a simple hash of the text to produce a consistent unit
    vector.  The vectors are NOT semantically meaningful, but they
    allow the pipeline to run end-to-end without API calls.

    Args:
        texts: List of text strings.
        dim:   Embedding dimensionality (default 768).

    Returns:
        List of unit-normalised pseudo-embedding vectors.
    """
    results: list[list[float]] = []

    for text in texts:
        vector = [0.0] * dim

        # Compute a 32-bit hash from the text (same algorithm as TS)
        seed = 0
        for ch in text:
            seed = ((seed << 5) - seed + ord(ch)) & 0xFFFFFFFF

        # Simple LCG PRNG seeded by text hash
        state = abs(seed) or 42
        for i in range(dim):
            state = (state * 1103515245 + 12345) & 0x7FFFFFFF
            vector[i] = (state / 0x7FFFFFFF) * 2 - 1  # range [-1, 1]

        # Normalise to unit vector
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0:
            vector = [v / norm for v in vector]

        results.append(vector)

    return results
