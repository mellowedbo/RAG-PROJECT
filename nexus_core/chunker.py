"""
NEXUS — Chunking Engine
========================
Recursive character splitting with section-heading awareness.
Faithful port of the TypeScript chunker from src/lib/chunker.ts.
"""

from __future__ import annotations

import re
from typing import Optional


# Regex for detecting SEC-style section headings
_SECTION_REGEX = re.compile(
    r"^(?:ITEM\s+\d+[A-Z]?\.?|PART\s+[IVX]+|SECTION\s+\d+|"
    r"RISK\s+FACTORS|MD&A|MANAGEMENT.S\s+DISCUSSION|"
    r"EXECUTIVE\s+SUMMARY|CREDIT\s+RISK|MARKET\s+RISK|"
    r"OPERATIONAL\s+RISK|REGULATORY|COMPLIANCE|"
    r"FINANCIAL\s+HIGHLIGHTS|CLIMATE|ESG)",
    re.IGNORECASE | re.MULTILINE,
)


def _split_recursive(
    text: str,
    separators: list[str],
    chunk_size: int,
    overlap: int,
    sep_index: int,
) -> list[str]:
    """Internal recursive splitter — mirrors the TS implementation."""
    if len(text) <= chunk_size:
        return [text]

    # Exhausted all separators — character-level split
    if sep_index >= len(separators):
        result: list[str] = []
        i = 0
        while i < len(text):
            result.append(text[i : i + chunk_size])
            i += chunk_size - overlap
        return result

    sep = separators[sep_index]
    parts = text.split(sep)
    result = []
    current = ""

    for part in parts:
        candidate = (current + sep + part) if current else part

        if len(candidate) > chunk_size and len(current) > 0:
            result.append(current)
            overlap_text = current[-overlap:] if len(current) > overlap else current
            current = overlap_text + sep + part

            # Single part still exceeds — recurse with next separator
            if len(part) > chunk_size:
                sub_parts = _split_recursive(
                    part, separators, chunk_size, overlap, sep_index + 1
                )
                result.extend(sub_parts[:-1])
                current = sub_parts[-1] if sub_parts else ""
        else:
            current = candidate

    if current.strip():
        result.append(current)

    # Re-check for chunks still too long
    final: list[str] = []
    for chunk in result:
        if len(chunk) > chunk_size * 1.5:
            final.extend(
                _split_recursive(chunk, separators, chunk_size, overlap, sep_index + 1)
            )
        else:
            final.append(chunk)

    return final


def chunk_text_recursive(
    text: str,
    chunk_size: int = 800,
    overlap: int = 120,
    min_chunk_size: int = 80,
) -> list[dict]:
    """
    Recursive character text splitter with section-heading detection.

    Tries separators in priority order:
        '\\n\\n', '\\n', '. ', '? ', '! ', '; ', ' ', character-level

    Each result dict contains:
        content      — the chunk text
        chunk_index  — zero-based index
        section      — detected section heading or None
        word_count   — number of words
        char_count   — number of characters

    Args:
        text:           Raw document text to chunk.
        chunk_size:     Maximum chunk size in characters.
        overlap:        Number of characters to overlap between chunks.
        min_chunk_size: Minimum chunk size; smaller chunks are merged forward.

    Returns:
        List of chunk dicts sorted by chunk_index.
    """
    if not text or not text.strip():
        return []

    separators = ["\n\n", "\n", ". ", "? ", "! ", "; ", " ", ""]

    raw_chunks = _split_recursive(text, separators, chunk_size, overlap, 0)

    # Post-process: detect section headings and assign metadata
    chunks: list[dict] = []
    current_section: Optional[str] = None

    for i in range(len(raw_chunks)):
        raw = raw_chunks[i].strip()
        if len(raw) < min_chunk_size and i < len(raw_chunks) - 1:
            # Too small — merge with next chunk
            raw_chunks[i + 1] = raw + "\n\n" + raw_chunks[i + 1]
            continue

        section_match = _SECTION_REGEX.match(raw)
        if section_match:
            current_section = section_match.group(0).upper()

        words = [w for w in raw.split() if w]
        chunks.append(
            {
                "content": raw,
                "chunk_index": len(chunks),
                "section": current_section,
                "word_count": len(words),
                "char_count": len(raw),
            }
        )

    return chunks
