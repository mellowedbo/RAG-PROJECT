"""
NEXUS — Vector Database (In-Memory)
=====================================
Simple in-memory vector store with brute-force cosine similarity search.
Designed for <10K chunks — no external dependency needed.

Faithful port of the TypeScript MemoryVectorDB from src/lib/vectordb/memory.ts.
"""

from __future__ import annotations

import json
from typing import Any, Optional

from nexus_core.retriever import cosine_similarity


class VectorStore:
    """
    In-memory vector store.

    Stores vectors with string IDs and arbitrary metadata dicts.
    Search is brute-force cosine similarity — fast enough for
    collections under ~10K vectors.

    Usage::

        store = VectorStore()
        store.add("chunk-0", [0.1, 0.2, ...], {"section": "RISK FACTORS"})
        results = store.search(query_vector, top_k=6)
        # -> [(0.92, {"id": "chunk-0", "vector": [...], "metadata": {...}}), ...]
    """

    def __init__(self) -> None:
        self._entries: list[dict] = []  # each: {"id": str, "vector": list, "metadata": dict}

    # ─── Add ──────────────────────────────────────────────────

    def add(self, id: str, vector: list[float], metadata: dict) -> None:
        """
        Add a vector entry to the store.

        Args:
            id:       Unique identifier for this entry.
            vector:   Embedding vector.
            metadata: Arbitrary metadata dict.
        """
        self._entries.append({"id": id, "vector": vector, "metadata": metadata})

    # ─── Search ───────────────────────────────────────────────

    def search(
        self,
        query_vector: list[float],
        top_k: int = 6,
    ) -> list[tuple[float, dict]]:
        """
        Search for the *top_k* most similar entries.

        Args:
            query_vector: The query embedding.
            top_k:        Number of results to return.

        Returns:
            List of ``(score, entry_dict)`` tuples sorted by score
            descending.  Each *entry_dict* has keys ``id``, ``vector``,
            ``metadata``, and ``score``.
        """
        scored: list[tuple[float, dict]] = []
        for entry in self._entries:
            if not entry["vector"]:
                continue
            score = cosine_similarity(query_vector, entry["vector"])
            scored.append((score, entry))

        scored.sort(key=lambda x: -x[0])
        return scored[:top_k]

    # ─── Delete by Prefix ─────────────────────────────────────

    def delete_by_prefix(self, prefix: str) -> int:
        """
        Remove all entries whose ID starts with *prefix*.

        Returns:
            The number of entries removed.
        """
        before = len(self._entries)
        self._entries = [e for e in self._entries if not e["id"].startswith(prefix)]
        return before - len(self._entries)

    # ─── Length & Clear ───────────────────────────────────────

    def __len__(self) -> int:
        return len(self._entries)

    def clear(self) -> None:
        """Remove all entries from the store."""
        self._entries = []

    # ─── Serialization ────────────────────────────────────────

    def serialize(self) -> str:
        """Serialize all entries to a JSON string."""
        return json.dumps(self._entries)

    @classmethod
    def deserialize(cls, json_str: str) -> "VectorStore":
        """Deserialize entries from a JSON string."""
        store = cls()
        try:
            store._entries = json.loads(json_str)
        except (json.JSONDecodeError, TypeError):
            pass  # ignore corrupt data
        return store
