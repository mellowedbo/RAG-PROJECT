"""
NEXUS — Retriever
==================
TF-IDF retrieval + cosine similarity on embeddings.
Faithful port of the TypeScript retriever from src/lib/retriever.ts.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from typing import Optional


# ─── Stop Words ───────────────────────────────────────────────

STOP_WORDS = frozenset(
    {
        "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "can", "shall", "to", "of", "in", "for",
        "on", "with", "at", "by", "from", "as", "into", "through", "during",
        "before", "after", "above", "below", "between", "out", "off", "over",
        "under", "again", "further", "then", "once", "and", "but", "or", "nor",
        "not", "so", "yet", "both", "either", "neither", "each", "every", "all",
        "any", "few", "more", "most", "other", "some", "such", "no", "only",
        "own", "same", "than", "too", "very", "just", "because", "if", "when",
        "where", "how", "what", "which", "who", "whom", "this", "that", "these",
        "those", "i", "me", "my", "we", "our", "you", "your", "he", "him",
        "his", "she", "her", "it", "its", "they", "them", "their",
    }
)

_TERM_RE = re.compile(r"[a-z0-9]{3,}")


def _extract_terms(text: str) -> list[str]:
    """Tokenise, lowercase, and filter stop words."""
    return [
        w
        for w in _TERM_RE.findall(text.lower())
        if w not in STOP_WORDS
    ]


# ─── IDF ──────────────────────────────────────────────────────

def compute_idf(chunks: list[dict]) -> dict[str, float]:
    """
    Compute smoothed inverse-document-frequency for every term
    across all chunks.

    Each chunk dict must have a ``content`` key.

    Returns:
        Dict mapping term -> IDF value.
    """
    n = len(chunks)
    if n == 0:
        return {}

    doc_freq: Counter = Counter()
    for chunk in chunks:
        unique_terms = set(_TERM_RE.findall(chunk["content"].lower()))
        for term in unique_terms:
            doc_freq[term] += 1

    idf: dict[str, float] = {}
    for term, df in doc_freq.items():
        idf[term] = math.log((n + 1) / (df + 1)) + 1  # smoothed IDF
    return idf


# ─── TF-IDF Scoring ──────────────────────────────────────────

def tfidf_score(query: str, chunk_text: str, idf_dict: dict[str, float]) -> float:
    """
    Compute TF-IDF similarity between *query* and *chunk_text*.

    Uses sublinear TF scaling ``(1 + log(tf))`` to prevent long
    chunks from dominating, plus section-heading bonus.
    """
    q_terms = set(_TERM_RE.findall(query.lower()))
    c_terms = _extract_terms(chunk_text)

    if not q_terms or not c_terms:
        return 0.0

    c_counter = Counter(c_terms)

    score = 0.0
    matched = 0
    for term in q_terms:
        if term in c_counter:
            tf = 1 + math.log(c_counter[term])  # sublinear TF
            term_idf = idf_dict.get(term, 1.0)
            score += tf * term_idf
            matched += 1

    # Coverage: fraction of query terms matched
    coverage = matched / len(q_terms)
    # Normalise by sqrt of chunk length to prevent length bias
    norm = math.sqrt(sum((1 + math.log(v)) ** 2 for v in c_counter.values()))

    return (score * coverage) / max(norm, 1e-8)


def retrieve_tfidf(
    query: str,
    chunks: list[dict],
    idf_dict: dict[str, float],
    top_k: int = 6,
) -> list[tuple[float, dict]]:
    """
    Retrieve the top-*k* chunks by TF-IDF similarity.

    Each chunk dict must have a ``content`` key and may have a
    ``section`` key (used for heading bonus).

    Returns:
        List of ``(score, chunk_dict)`` tuples, sorted descending.
    """
    q_terms = set(_TERM_RE.findall(query.lower()))
    if not q_terms:
        return [(0.0, c) for c in chunks[:top_k]]

    scored: list[tuple[float, dict]] = []
    for chunk in chunks:
        base_score = tfidf_score(query, chunk["content"], idf_dict)

        # Section-heading bonus: 1.5x if section contains query terms
        section = chunk.get("section")
        if section:
            for qt in q_terms:
                if qt in section.lower():
                    base_score *= 1.5
                    break

        scored.append((base_score, chunk))

    scored.sort(key=lambda x: -x[0])
    return scored[:top_k]


# ─── Cosine Similarity ───────────────────────────────────────

def cosine_similarity(a: list[float], b: list[float]) -> float:
    """
    Compute the cosine similarity between two vectors.

    Returns 0 if vectors are empty or have different lengths.
    """
    if len(a) != len(b) or len(a) == 0:
        return 0.0

    dot_product = 0.0
    norm_a = 0.0
    norm_b = 0.0
    for ai, bi in zip(a, b):
        dot_product += ai * bi
        norm_a += ai * ai
        norm_b += bi * bi

    denominator = math.sqrt(norm_a) * math.sqrt(norm_b)
    return dot_product / denominator if denominator != 0 else 0.0


def retrieve_embedding(
    query_embedding: list[float],
    chunk_embeddings: list[list[float]],
    top_k: int = 6,
) -> list[tuple[float, int]]:
    """
    Retrieve the top-*k* chunk indices by cosine similarity
    between *query_embedding* and each vector in *chunk_embeddings*.

    Returns:
        List of ``(score, index)`` tuples, sorted descending.
    """
    scored: list[tuple[float, int]] = []
    for i, emb in enumerate(chunk_embeddings):
        if not emb or len(emb) == 0:
            continue
        score = cosine_similarity(query_embedding, emb)
        scored.append((score, i))

    scored.sort(key=lambda x: -x[0])
    return scored[:top_k]
