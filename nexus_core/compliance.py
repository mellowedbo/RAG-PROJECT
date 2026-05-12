"""
NEXUS — Compliance Scanner
============================
Regex pattern matching against SEC, SOX, FCPA, GDPR, OFAC, Basel III.
Faithful port of the TypeScript compliance module from src/lib/compliance.ts.
"""

from __future__ import annotations

import re
from typing import NamedTuple


class CompliancePattern(NamedTuple):
    """A single compliance pattern tuple."""

    name: str
    regex: str
    reference: str
    severity: str
    description: str


# ─── Compliance Patterns ──────────────────────────────────────
# Each tuple: (name, regex, reference, severity, description)

COMPLIANCE_PATTERNS: list[tuple[str, str, str, str, str]] = [
    # Risk Disclosure
    (
        "Adverse Business Impact",
        r"may\s+(?:adversely\s+)?affect\s+(?:our\s+)?(?:business|results|financial|operations)",
        "SEC Reg S-K Item 105",
        "high",
        "General risk factor identified",
    ),
    (
        "Legal/Regulatory Proceedings",
        r"subject\s+to\s+(?:various\s+)?(?:legal|regulatory|governmental)\s+(?:proceedings|actions|investigations)",
        "SEC Reg S-K Item 103",
        "critical",
        "Legal/regulatory proceeding detected",
    ),
    (
        "Internal Control Weakness",
        r"(?:material\s+)?weakness(?:es)?\s+(?:in\s+)?(?:our\s+)?internal\s+control",
        "SOX Section 404",
        "critical",
        "Internal control weakness disclosed",
    ),
    # Financial Reporting
    (
        "Financial Restatement",
        r"restat(?:e|ed|ement|ing)\s+(?:of\s+)?(?:our\s+)?(?:previously\s+)?(?:issued\s+)?financial",
        "SEC Form 8-K Item 4.02",
        "critical",
        "Financial restatement indicated",
    ),
    (
        "Impairment Charge",
        r"(?:impairment|write-?down|write-?off)\s+(?:charge|loss|expense)",
        "ASC 360-10",
        "high",
        "Impairment charge identified",
    ),
    (
        "Related Party Transaction",
        r"(?:related\s+party|affiliated?\s+entity)\s+(?:transaction|relationship)",
        "ASC 850",
        "medium",
        "Related party transaction identified",
    ),
    # Regulatory Compliance
    (
        "Covenant Non-Compliance",
        r"not\s+in\s+compliance\s+with",
        "Credit Agreement",
        "high",
        "Covenant compliance issue",
    ),
    (
        "Sanctions Reference",
        r"(?:sanctions|embargo|ofac)",
        "OFAC / International Sanctions",
        "critical",
        "Sanctions reference detected",
    ),
    (
        "Anti-Corruption Reference",
        r"(?:anti-?corruption|fcpa|bribery)",
        "FCPA / UK Bribery Act",
        "critical",
        "Anti-corruption reference detected",
    ),
    (
        "Cybersecurity Risk",
        r"(?:data\s+breach|cybersecurity\s+incident)",
        "SEC Cyber Disclosure Rules",
        "high",
        "Cybersecurity risk identified",
    ),
    # Market Risk
    (
        "Market Risk Factor",
        r"(?:interest\s+rate|currency|foreign\s+exchange)\s+risk",
        "SEC Reg S-K Item 305",
        "medium",
        "Market risk factor identified",
    ),
    (
        "Credit Risk Exposure",
        r"(?:credit\s+risk|counterparty\s+risk|default\s+risk)",
        "Basel III / CCAR",
        "high",
        "Credit risk exposure identified",
    ),
    (
        "Liquidity Risk",
        r"liquidity\s+risk",
        "Basel III LCR",
        "high",
        "Liquidity risk identified",
    ),
    (
        "VaR Metric",
        r"(?:value[- ]at[- ]risk|var\b)",
        "Basel III / FRB SR 11-7",
        "medium",
        "VaR metric disclosed",
    ),
    # Climate & ESG
    (
        "Climate Financial Risk",
        r"climate[- ]?related\s+(?:financial\s+)?risk",
        "TCFD / SEC Climate Rules",
        "medium",
        "Climate-related financial risk",
    ),
    (
        "Financed Emissions",
        r"financed\s+emissions",
        "GHG Protocol / PCAF",
        "low",
        "Financed emissions disclosed",
    ),
]

# Severity sort order
_SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def scan_compliance(chunks: list[dict]) -> list[dict]:
    """
    Scan chunks for compliance patterns.

    Each chunk dict must have a ``content`` key and should have
    a ``chunk_index`` key.

    Returns:
        List of finding dicts sorted by severity (critical first).
        Each finding has keys: ``category``, ``severity``, ``description``,
        ``reference``, ``chunk_index``, ``excerpt``.
    """
    findings: list[dict] = []

    for chunk in chunks:
        content = chunk.get("content", "")
        chunk_index = chunk.get("chunk_index", 0)

        for name, pattern, reference, severity, description in COMPLIANCE_PATTERNS:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                match_start = match.start()
                match_end = match.end()

                # Extract surrounding context
                start = max(0, match_start - 60)
                end = min(len(content), match_end + 60)
                excerpt = content[start:end]

                if start > 0:
                    excerpt = "..." + excerpt
                if end < len(content):
                    excerpt = excerpt + "..."

                findings.append(
                    {
                        "category": name,
                        "severity": severity,
                        "description": description,
                        "reference": reference,
                        "chunk_index": chunk_index,
                        "excerpt": excerpt.replace("\n", " "),
                    }
                )

    findings.sort(key=lambda f: _SEVERITY_ORDER.get(f["severity"], 99))
    return findings
