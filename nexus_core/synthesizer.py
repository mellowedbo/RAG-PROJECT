"""
NEXUS — Synthesizer
=====================
Gemini LLM synthesis with citation-grounded analysis.
Falls back to template synthesis when no API key is available.

Port of the Gemini generation logic from src/app/api/gemini/route.ts
and the synthesis logic from src/hooks/useRAGPipeline.ts.
"""

from __future__ import annotations

import os
import textwrap
from typing import Optional


_SYSTEM_PROMPT = (
    "You are NEXUS, an elite financial intelligence analyst. "
    "You have been provided with excerpts from financial documents "
    "retrieved by an agentic RAG pipeline. Analyze them thoroughly "
    "and answer the query.\n\n"
    "RULES:\n"
    "- Cite every claim with [Source X] notation.\n"
    "- Use specific data points, percentages, and figures from the sources.\n"
    "- Classify risks as Critical / High / Medium / Low.\n"
    "- Cross-reference findings across different document sources.\n"
    "- Flag any compliance concerns explicitly.\n"
    "- If the context is insufficient, say so clearly.\n"
)


def generate_answer(
    query: str,
    context_chunks: list[dict],
    model: str = "gemini-2.0-flash",
) -> str:
    """
    Synthesize an answer using Gemini LLM with retrieved context.

    Each *context_chunk* dict should have at least a ``content`` key.
    Optional keys: ``chunk_index``, ``section``, ``doc_title``, ``ticker``,
    ``score``, ``composite``.

    If no Gemini API key is configured (via ``nexus_core.configure_gemini``),
    a structured template response is generated instead.

    Args:
        query:           The user's question.
        context_chunks:  Ranked list of retrieved chunk dicts.
        model:           Gemini model name (default gemini-2.0-flash).

    Returns:
        Synthesised answer string.
    """
    # Build rich context
    context_parts: list[str] = []
    for i, chunk in enumerate(context_chunks[:6]):
        doc_title = chunk.get("doc_title", "Unknown Document")
        doc_type = chunk.get("doc_type", "")
        chunk_idx = chunk.get("chunk_index", i)
        score = chunk.get("composite", chunk.get("score", 0))
        section = chunk.get("section", "")

        header = (
            f"[Source {i + 1}: {doc_title}"
            f"{' | ' + doc_type if doc_type else ''}"
            f" | Chunk #{chunk_idx}"
            f"{' | ' + section if section else ''}"
            f" | Score: {score:.3f}]"
        )
        context_parts.append(f"{header}\n{chunk['content']}")

    context = "\n\n---\n\n".join(context_parts)

    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        return _template_synthesis(query, context_chunks)

    try:
        import google.generativeai as genai  # type: ignore

        gen_model = genai.GenerativeModel(
            model_name=model,
            system_instruction=_SYSTEM_PROMPT,
        )

        user_prompt = (
            f"QUERY: {query}\n\n"
            f"RETRIEVED DOCUMENT EXCERPTS:\n{context}\n\n"
            f"Provide a comprehensive analysis with the following sections:\n\n"
            f"**KEY FINDINGS**: Main insights with specific data points and [Source X] citations\n"
            f"**EVIDENCE**: Supporting evidence with exact figures and percentages\n"
            f"**RISK ASSESSMENT**: All risks identified, classified by severity (Critical/High/Medium/Low)\n"
            f"**CROSS-REFERENCE**: Connections or contradictions across different document sources\n"
            f"**LIMITATIONS**: What information is missing or uncertain\n\n"
            f"Be precise with numbers, cite every claim, and flag any compliance concerns."
        )

        response = gen_model.generate_content(user_prompt)
        return response.text

    except ImportError:
        return _template_synthesis(query, context_chunks)

    except Exception as exc:
        return (
            f"[LLM Error: {exc}]\n\n"
            f"Falling back to template synthesis...\n\n"
            + _template_synthesis(query, context_chunks)
        )


# ─── Template Fallback ───────────────────────────────────────

def _template_synthesis(query: str, context_chunks: list[dict]) -> str:
    """Generate a structured response without LLM using template."""
    lines = ["**KEY FINDINGS**", ""]

    for i, chunk in enumerate(context_chunks[:4]):
        ticker = chunk.get("ticker", "N/A")
        doc_type = chunk.get("doc_type", "Document")
        content = chunk.get("content", "")
        lines.append(
            f"- From {ticker} ({doc_type}): "
            f"{content[:200]}... [Source {i + 1}]"
        )

    lines.extend(
        [
            "",
            "**EVIDENCE**: See source excerpts above for specific data points.",
            "",
            "**RISK ASSESSMENT**: See compliance scan below for risk classification.",
            "",
            "**LIMITATIONS**: Template mode -- LLM synthesis unavailable.",
        ]
    )
    return "\n".join(lines)
