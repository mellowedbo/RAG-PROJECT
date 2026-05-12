# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  NEXUS — Agentic RAG for Financial Intelligence | Google Colab Notebook ║
# ║  4-Agent Pipeline: Ingestion → Retrieval → Reasoning → Synthesis       ║
# ║  Powered by Google Gemini 2.0 Flash (Free Tier)                        ║
# ╚══════════════════════════════════════════════════════════════════════════╝
#
# Paste this entire file into a single Colab cell, or split at the
# "# ═══ CELL BREAK ═══" markers for multi-cell usage.
# Get a free Gemini API key at: https://aistudio.google.com/apikey
# ════════════════════════════════════════════════════════════════════════════

# ═══ CELL 1: Install Dependencies ═════════════════════════════════════════

!pip install -q google-generativeai pandas matplotlib

import os, sys, json, re, math, time, textwrap
from datetime import datetime
from collections import Counter

import google.generativeai as genai
import pandas as pd
import matplotlib
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# ─── ANSI Color Codes for Terminal Output ─────────────────────────────────
class C:
    """ANSI escape codes for colorful terminal output in Colab."""
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    DIM     = "\033[2m"
    ITALIC  = "\033[3m"
    RED     = "\033[91m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    BLUE    = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN    = "\033[96m"
    WHITE   = "\033[97m"
    BG_RED    = "\033[41m"
    BG_GREEN  = "\033[42m"
    BG_YELLOW = "\033[43m"
    BG_BLUE   = "\033[44m"
    BG_CYAN   = "\033[46m"

def banner(text, color=C.CYAN, width=68):
    """Print a styled banner."""
    print(f"\n{color}{C.BOLD}{'═' * width}{C.RESET}")
    print(f"{color}{C.BOLD}  {text}{C.RESET}")
    print(f"{color}{C.BOLD}{'═' * width}{C.RESET}\n")

def section(text, color=C.BLUE):
    """Print a section header."""
    print(f"\n{color}{C.BOLD}▶ {text}{C.RESET}")
    print(f"{color}{'─' * 60}{C.RESET}")

def status(msg, icon="✓", color=C.GREEN):
    """Print a status message with icon."""
    print(f"  {color}{icon}{C.RESET} {msg}")

def progress_bar(current, total, width=40, prefix=""):
    """Display a simple text progress bar."""
    pct = current / max(total, 1)
    filled = int(width * pct)
    bar = "█" * filled + "░" * (width - filled)
    sys.stdout.write(f"\r  {prefix} [{C.CYAN}{bar}{C.RESET}] {pct*100:.0f}% ({current}/{total})")
    sys.stdout.flush()
    if current == total:
        print()

# ═══ CELL 2: Configure Gemini API ═════════════════════════════════════════

banner("NEXUS — Agentic RAG for Financial Intelligence", C.MAGENTA)
print(f"  {C.DIM}Pipeline: Ingestion → Retrieval → Reasoning → Synthesis{C.RESET}")
print(f"  {C.DIM}Model: Google Gemini 2.0 Flash (Free Tier){C.RESET}")
print(f"  {C.DIM}Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{C.RESET}\n")

section("Configuring Gemini API", C.BLUE)

# Try Colab secrets first, then fall back to user input
GEMINI_KEY = None
try:
    from google.colab import userdata
    GEMINI_KEY = userdata.get('GOOGLE_API_KEY')
    status("API key loaded from Colab secrets", "🔑", C.GREEN)
except:
    pass

if not GEMINI_KEY:
    GEMINI_KEY = input("  Enter your Gemini API key (free at aistudio.google.com/apikey): ").strip()

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
    status("Gemini 2.0 Flash API configured successfully", "✓", C.GREEN)
else:
    model = None
    status("No API key provided — LLM synthesis will be skipped", "⚠", C.YELLOW)
    status("Retrieval and reasoning pipeline still works without LLM", "i", C.CYAN)

# ═══ CELL 3: Load Financial Documents ═════════════════════════════════════

section("Loading Financial Documents", C.BLUE)

documents = [
    {
        "title": "Tesla, Inc. — 10-K Annual Report (FY 2024)",
        "type": "10-K Filing",
        "ticker": "TSLA",
        "sector": "Automotive / Clean Energy",
        "content": (
            "ITEM 1A. RISK FACTORS\n\n"
            "We have identified a material weakness in our internal control over financial "
            "reporting related to the design and operating effectiveness of controls over "
            "the accuracy and completeness of certain accounting entries and processes. "
            "This material weakness relates to insufficient review controls and the lack of "
            "effective monitoring activities within our financial close process.\n\n"
            "Our business could be adversely affected by cybersecurity incidents, such as "
            "ransomware attacks, data breaches, or other security incidents involving our "
            "information technology systems or those of our third-party service providers. "
            "A significant cybersecurity incident could result in unauthorized access to "
            "proprietary data, customer information, or trade secrets.\n\n"
            "Interest rate risk remains a significant factor. A 100 basis point parallel "
            "shift in interest rates would result in an estimated $2.8 billion impact on "
            "our fixed-income portfolio. Foreign currency fluctuations contributed "
            "approximately $1.1 billion in translation losses during the fiscal year.\n\n"
            "ITEM 6. SELECTED FINANCIAL DATA\n\n"
            "Revenue for the year ended December 31, 2024 was $96.8 billion, representing "
            "an increase of 18% compared to the prior year. Automotive revenues were "
            "$78.5 billion, an increase of 15% from 2023. Energy generation and storage "
            "revenues were $14.2 billion, an increase of 67% year-over-year, driven by "
            "Megapack deployments and Powerwall installations.\n\n"
            "Gross margin was 17.9% compared to 18.2% in the prior year, primarily due "
            "to pricing adjustments and product mix. Operating income was $7.8 billion "
            "with an operating margin of 8.1%. Net income attributable to common "
            "stockholders was $5.4 billion, or $1.70 per diluted share.\n\n"
            "FORWARD GUIDANCE: For 2025, we expect vehicle deliveries to grow by 20-25%, "
            "energy storage deployments to grow by at least 50%, and total revenue to "
            "exceed $110 billion. Capital expenditures are projected at $8-10 billion, "
            "primarily for Gigafactory expansion and AI training infrastructure."
        ),
    },
    {
        "title": "Goldman Sachs Group — Q4 2024 Earnings Report",
        "type": "Quarterly Earnings",
        "ticker": "GS",
        "sector": "Investment Banking",
        "content": (
            "FINANCIAL HIGHLIGHTS — Q4 2024\n\n"
            "Q4 2024 revenue totaled $13.9 billion, an increase of 23% year-over-year, "
            "driven by strong performance in Global Banking & Markets. Full-year 2024 "
            "revenue was $53.2 billion, up 16% from the prior year. Net earnings were "
            "$15.3 billion, an increase of 68% year-over-year. Diluted EPS was $42.14, "
            "compared to $25.05 in the prior year.\n\n"
            "Global Banking & Markets revenue was $8.7 billion for Q4, reflecting "
            "increased advisory fees and equity underwriting activity. Asset & Wealth "
            "Management recorded $4.2 billion in revenue, with record management fees "
            "driven by higher average assets under supervision of $3.1 trillion.\n\n"
            "RISK AND COMPLIANCE FACTORS\n\n"
            "Total credit exposure was $187 billion as of year-end. The firm is currently "
            "subject to multiple SEC and CFTC investigations related to trading practices "
            "and record-keeping requirements. The firm disclosed FCPA violations in the "
            "Asia-Pacific region involving intermediary payments in three jurisdictions. "
            "Potential fines and penalties associated with these investigations could "
            "exceed $500 million based on regulatory precedents.\n\n"
            "A data breach affecting approximately 12,000 client accounts was identified "
            "in Q3 2024, resulting in regulatory notification requirements under SEC "
            "cybersecurity disclosure rules. The Liquidity Coverage Ratio (LCR) was 128%, "
            "below the internal target of 135% but above the regulatory minimum of 100%. "
            "Operational risk losses totaled $412 million for the fiscal year, including "
            "technology failures and process breakdowns."
        ),
    },
    {
        "title": "JPMorgan Chase — 2024 Risk Assessment Report",
        "type": "Risk Assessment",
        "ticker": "JPM",
        "sector": "Universal Banking",
        "content": (
            "EXECUTIVE SUMMARY — RISK PROFILE 2024\n\n"
            "Total credit exposure across all business segments was $1.2 trillion as of "
            "December 31, 2024, representing a 4.3% increase from the prior year. "
            "Commercial real estate (CRE) delinquencies rose to 3.2%, up from 2.1% in "
            "2023, primarily driven by office sector stress in major metropolitan markets. "
            "The firm has increased its provision for credit losses by $1.8 billion to "
            "reflect the deteriorating CRE outlook.\n\n"
            "MARKET RISK METRICS\n\n"
            "Value-at-Risk (VaR) at the 99% confidence level was $98 million, an increase "
            "from $84 million in the prior year. Stressed VaR was $156 million. The "
            "increase reflects higher market volatility and expanded trading positions in "
            "rates and foreign exchange. Expected Shortfall (ES) was $142 million.\n\n"
            "REGULATORY AND COMPLIANCE MATTERS\n\n"
            "The firm disclosed 23 active regulatory investigations as of year-end, "
            "including matters involving OFAC sanctions violations related to transactions "
            "processed for entities in sanctioned jurisdictions. FCPA investigations are "
            "ongoing in three countries related to hiring practices and government "
            "entity engagement. Potential aggregate penalties from these matters are "
            "estimated at $1.2-2.4 billion.\n\n"
            "Operational losses for the year totaled $892 million, including technology "
            "incidents, processing errors, and fraud losses. Climate risk analysis "
            "indicates potential losses of $8-12 billion under adverse climate scenarios "
            "over a 10-year horizon, with concentrated exposure in coastal real estate "
            "and carbon-intensive industries. The firm has committed $350 billion to "
            "sustainable finance initiatives through 2030."
        ),
    },
]

# Display document metadata
for i, doc in enumerate(documents):
    progress_bar(i + 1, len(documents), prefix="Loading")
    print(f"  {C.BOLD}{doc['title']}{C.RESET}")
    print(f"    Type: {doc['type']}  |  Ticker: {C.GREEN}{doc['ticker']}{C.RESET}  |  Sector: {doc['sector']}")
    print(f"    Content length: {len(doc['content']):,} characters")
    print()

status(f"{len(documents)} documents loaded ({sum(len(d['content']) for d in documents):,} total characters)")

# ═══ CELL 4: Agent 1 — Ingestion (Chunking Engine) ════════════════════════

section("AGENT 1: INGESTION — Document Chunking", C.MAGENTA)

def chunk_text(text, max_size=600, overlap=80):
    """
    Split text into overlapping chunks for retrieval.

    Strategy: Split on paragraph boundaries first. If a paragraph
    exceeds max_size, split on sentence boundaries. Maintain overlap
    between consecutive chunks for context continuity.

    Args:
        text: Raw document text
        max_size: Maximum chunk size in characters
        overlap: Number of characters to overlap between chunks

    Returns:
        List of chunk strings
    """
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    chunks = []
    current = ""

    for para in paragraphs:
        # If a single paragraph is too long, split on sentences
        if len(para) > max_size:
            sentences = re.split(r'(?<=[.!?])\s+', para)
            for sent in sentences:
                if len(current) + len(sent) > max_size and len(current) > 80:
                    chunks.append(current.strip())
                    # Overlap: keep last N characters
                    current = current[-overlap:] + " " + sent
                else:
                    current = current + " " + sent if current else sent
        elif len(current) + len(para) > max_size and len(current) > 80:
            chunks.append(current.strip())
            current = current[-overlap:] + "\n\n" + para
        else:
            current = current + "\n\n" + para if current else para

    if current.strip():
        chunks.append(current.strip())

    return chunks

# Process all documents with progress bar
all_chunks = []
chunk_metadata = []

print(f"\n  {C.BOLD}Chunking Configuration:{C.RESET}")
print(f"    Max chunk size:  600 characters")
print(f"    Overlap:         80 characters")
print(f"    Strategy:        Paragraph-first with sentence fallback")
print()

for i, doc in enumerate(documents):
    progress_bar(i + 1, len(documents), prefix="Chunking")
    chunks = chunk_text(doc["content"])
    for j, chunk in enumerate(chunks):
        all_chunks.append({
            "doc_title": doc["title"],
            "doc_type": doc["type"],
            "ticker": doc["ticker"],
            "chunk_index": j,
            "content": chunk,
            "char_count": len(chunk),
            "word_count": len(chunk.split()),
        })
    chunk_metadata.append({
        "title": doc["title"],
        "ticker": doc["ticker"],
        "num_chunks": len(chunks),
        "avg_chunk_size": sum(len(c) for c in chunks) / max(len(chunks), 1),
        "total_chars": sum(len(c) for c in chunks),
    })

print()
status(f"{len(all_chunks)} chunks created from {len(documents)} documents")

# Build DataFrame summary
chunk_df = pd.DataFrame(all_chunks)
summary_df = pd.DataFrame(chunk_metadata)

print(f"\n  {C.BOLD}Chunk Distribution by Document:{C.RESET}\n")
for _, row in summary_df.iterrows():
    bar_len = int(row['num_chunks'] / summary_df['num_chunks'].max() * 30)
    bar = "█" * bar_len
    print(f"    {C.GREEN}{row['ticker']:<5}{C.RESET} │ {C.CYAN}{bar}{C.RESET} {row['num_chunks']} chunks "
          f"(avg {row['avg_chunk_size']:.0f} chars)")

# ═══ CELL 5: Agent 2 — Retrieval (TF-IDF Search) ═════════════════════════

section("AGENT 2: RETRIEVAL — TF-IDF Vector Space Model", C.BLUE)

def compute_idf(chunks_list):
    """Compute inverse document frequency for all terms across chunks."""
    N = len(chunks_list)
    doc_freq = Counter()
    for chunk in chunks_list:
        terms = set(re.findall(r'[a-z]{3,}', chunk["content"].lower()))
        for term in terms:
            doc_freq[term] += 1
    idf = {}
    for term, df in doc_freq.items():
        idf[term] = math.log((N + 1) / (df + 1)) + 1  # smoothed IDF
    return idf

# Pre-compute IDF across all chunks
idf_cache = compute_idf(all_chunks)

def tfidf_score(query, chunk_text, idf_dict):
    """
    Compute TF-IDF similarity between query and chunk.

    Uses term frequency in chunk weighted by IDF,
    with sublinear TF scaling to prevent long chunks from dominating.
    """
    q_terms = set(re.findall(r'[a-z]{3,}', query.lower()))
    c_terms = re.findall(r'[a-z]{3,}', chunk_text.lower())

    if not q_terms or not c_terms:
        return 0.0

    # Term frequency with sublinear scaling
    c_counter = Counter(c_terms)
    score = 0.0
    matched = 0

    for term in q_terms:
        if term in c_counter:
            tf = 1 + math.log(c_counter[term])  # sublinear TF
            term_idf = idf_dict.get(term, 1.0)
            score += tf * term_idf
            matched += 1

    # Normalize by query length to reward high coverage
    coverage = matched / len(q_terms)
    # Normalize by document length to prevent length bias
    norm = math.sqrt(sum((1 + math.log(v)) ** 2 for v in c_counter.values()))

    return (score * coverage) / max(norm, 1e-8)

status(f"IDF index built over {len(idf_cache)} unique terms")

def retrieve(query, top_k=6):
    """
    Retrieve top-k chunks by TF-IDF similarity.

    Args:
        query: Natural language query string
        top_k: Number of results to return

    Returns:
        List of (score, chunk_dict) tuples, sorted by score descending
    """
    scored = []
    for chunk in all_chunks:
        score = tfidf_score(query, chunk["content"], idf_cache)
        scored.append((score, chunk))
    scored.sort(key=lambda x: -x[0])
    return scored[:top_k]

# ═══ CELL 6: Agent 3 — Reasoning (Scoring & Ranking) ═════════════════════

section("AGENT 3: REASONING — Multi-Signal Scoring & Ranking", C.YELLOW)

def reason_and_rank(query, retrieved_chunks):
    """
    Apply multi-signal reasoning to re-rank retrieved chunks.

    Signals:
    1. TF-IDF relevance score (primary)
    2. Document type priority (10-K > Risk Assessment > Earnings for risk queries)
    3. Chunk position bonus (earlier chunks often contain key information)
    4. Term density bonus (concentration of query terms in chunk)
    5. Entity-specific relevance (ticker/sector match with query terms)

    Returns:
        List of dicts with composite scores and signal breakdowns
    """
    q_terms = set(re.findall(r'[a-z]{3,}', query.lower()))
    is_risk_query = any(t in q_terms for t in ['risk', 'compliance', 'violation', 'sanctions',
                                                 'fcpa', 'breach', 'weakness', 'regulatory',
                                                 'investigation', 'penalty'])
    is_financial_query = any(t in q_terms for t in ['revenue', 'earnings', 'income', 'profit',
                                                     'margin', 'guidance', 'growth', 'financial'])
    is_cre_query = any(t in q_terms for t in ['cre', 'commercial', 'real', 'estate', 'delinquen',
                                               'property', 'office'])

    ranked = []
    for tfidf, chunk in retrieved_chunks:
        if tfidf <= 0:
            continue

        signals = {"tfidf": tfidf}

        # Signal 2: Document type priority based on query intent
        type_boost = 0
        if is_risk_query:
            type_boost = {"10-K Filing": 0.15, "Risk Assessment": 0.20, "Quarterly Earnings": 0.05}
        elif is_financial_query:
            type_boost = {"10-K Filing": 0.15, "Risk Assessment": 0.05, "Quarterly Earnings": 0.15}
        elif is_cre_query:
            type_boost = {"Risk Assessment": 0.25, "10-K Filing": 0.10, "Quarterly Earnings": 0.05}
        signals["type_boost"] = type_boost.get(chunk["doc_type"], 0)

        # Signal 3: Chunk position bonus (diminishing)
        signals["position"] = max(0, 0.05 * (1 - chunk["chunk_index"] / 10))

        # Signal 4: Term density (how concentrated are matches)
        c_terms = re.findall(r'[a-z]{3,}', chunk["content"].lower())
        if c_terms:
            matched = sum(1 for t in c_terms if t in q_terms)
            signals["density"] = 0.10 * (matched / len(c_terms)) * math.sqrt(len(q_terms))
        else:
            signals["density"] = 0

        # Signal 5: Entity/ticker relevance
        ticker_mentioned = chunk["ticker"].lower() in query.lower()
        signals["entity"] = 0.12 if ticker_mentioned else 0

        # Compute composite score
        composite = (
            signals["tfidf"] * 1.0 +
            signals["type_boost"] +
            signals["position"] +
            signals["density"] +
            signals["entity"]
        )
        signals["composite"] = composite

        ranked.append({
            "chunk": chunk,
            "signals": signals,
            "composite": composite,
        })

    # Sort by composite score
    ranked.sort(key=lambda x: -x["composite"])
    return ranked

status("Multi-signal reasoning engine initialized")
print(f"  Signals: TF-IDF, Doc-Type Priority, Position, Term Density, Entity Match")

# ═══ CELL 7: Agent 4 — Synthesis (Gemini LLM) ═══════════════════════════

section("AGENT 4: SYNTHESIS — Gemini LLM Integration", C.GREEN)

def synthesize(question, ranked_results):
    """
    Synthesize an answer using Gemini 2.0 Flash with retrieved context.

    If no API key was provided, generates a template-based response
    using the ranked chunks directly.
    """
    # Build rich context from ranked results
    context_parts = []
    for i, r in enumerate(ranked_results[:6]):
        chunk = r["chunk"]
        signals = r["signals"]
        context_parts.append(
            f"[Source {i+1}: {chunk['doc_title']} | {chunk['doc_type']} | "
            f"Chunk #{chunk['chunk_index']} | Score: {signals['composite']:.3f}]\n"
            f"{chunk['content']}"
        )

    context = "\n\n---\n\n".join(context_parts)

    if model is None:
        # Fallback: structured template response without LLM
        return _template_synthesis(question, ranked_results)

    prompt = f"""You are NEXUS, an elite financial intelligence analyst. You have been provided with excerpts from financial documents retrieved by an agentic RAG pipeline. Analyze them thoroughly and answer the query.

QUERY: {question}

RETRIEVED DOCUMENT EXCERPTS:
{context}

Provide a comprehensive analysis with the following sections:

**KEY FINDINGS**: Main insights with specific data points and [Source X] citations
**EVIDENCE**: Supporting evidence with exact figures and percentages
**RISK ASSESSMENT**: All risks identified, classified by severity (Critical/High/Medium/Low)
**CROSS-REFERENCE**: Connections or contradictions across different document sources
**LIMITATIONS**: What information is missing or uncertain

Be precise with numbers, cite every claim, and flag any compliance concerns."""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"[LLM Error: {e}]\n\nFalling back to template synthesis...\n\n" + _template_synthesis(question, ranked_results)

def _template_synthesis(question, ranked_results):
    """Generate a structured response without LLM using template."""
    lines = ["**KEY FINDINGS**", ""]
    for i, r in enumerate(ranked_results[:4]):
        chunk = r["chunk"]
        lines.append(f"• From {chunk['ticker']} ({chunk['doc_type']}): "
                     f"{chunk['content'][:200]}... [Source {i+1}]")
    lines.extend(["", "**EVIDENCE**: See source excerpts above for specific data points.",
                  "", "**RISK ASSESSMENT**: See compliance scan below for risk classification.",
                  "", "**LIMITATIONS**: Template mode — LLM synthesis unavailable."])
    return "\n".join(lines)

status("Synthesis agent ready (Gemini 2.0 Flash)" if model else "Synthesis agent in template mode (no API key)")

# ═══ CELL 8: Full Pipeline Execution ═════════════════════════════════════

banner("EXECUTING FULL 4-AGENT RAG PIPELINE", C.MAGENTA)

def run_pipeline(question):
    """Execute the complete 4-agent RAG pipeline with timing metrics."""
    pipeline_start = time.time()

    # Agent 1: Ingestion — already done (chunks pre-built)
    t0 = time.time()
    ingestion_ms = int((t0 - pipeline_start) * 1000)

    # Agent 2: Retrieval
    t1 = time.time()
    raw_results = retrieve(question, top_k=8)
    retrieval_ms = int((time.time() - t1) * 1000)

    # Agent 3: Reasoning
    t2 = time.time()
    ranked = reason_and_rank(question, raw_results)
    reasoning_ms = int((time.time() - t2) * 1000)

    # Agent 4: Synthesis
    t3 = time.time()
    answer = synthesize(question, ranked)
    synthesis_ms = int((time.time() - t3) * 1000)

    total_ms = int((time.time() - pipeline_start) * 1000)

    # Display results
    print(f"\n  {C.BOLD}{C.CYAN}Query:{C.RESET} {question}\n")

    # Show retrieval results
    print(f"  {C.BOLD}Retrieved & Ranked Chunks:{C.RESET}\n")
    for i, r in enumerate(ranked[:5]):
        chunk = r["chunk"]
        sig = r["signals"]
        # Color-code by score quality
        if sig["composite"] > 0.3:
            score_color = C.GREEN
        elif sig["composite"] > 0.15:
            score_color = C.YELLOW
        else:
            score_color = C.RED

        print(f"    {score_color}●{C.RESET} [{sig['composite']:.3f}] "
              f"{C.GREEN}{chunk['ticker']:<5}{C.RESET} │ "
              f"Chunk #{chunk['chunk_index']} │ "
              f"TF-IDF: {sig['tfidf']:.3f} │ "
              f"Type: {sig['type_boost']:.2f} │ "
              f"Density: {sig['density']:.3f}")
        print(f"      {C.DIM}{chunk['content'][:120]}...{C.RESET}\n")

    # Show LLM answer
    print(f"  {C.BOLD}{C.GREEN}═══ SYNTHESIZED ANALYSIS ═══{C.RESET}\n")
    print(textwrap.indent(answer, "    "))
    print()

    # Show timing
    print(f"  {C.BOLD}Pipeline Metrics:{C.RESET}")
    print(f"    {C.CYAN}Ingestion:{C.RESET}   {ingestion_ms:>6}ms  (pre-computed)")
    print(f"    {C.BLUE}Retrieval:{C.RESET}    {retrieval_ms:>6}ms  (TF-IDF + IDF index)")
    print(f"    {C.YELLOW}Reasoning:{C.RESET}    {reasoning_ms:>6}ms  (5-signal scoring)")
    print(f"    {C.GREEN}Synthesis:{C.RESET}    {synthesis_ms:>6}ms  (Gemini 2.0 Flash)")
    print(f"    {C.BOLD}Total:{C.RESET}        {C.BOLD}{total_ms:>6}ms{C.RESET}")

    return {
        "query": question,
        "chunks_retrieved": len(ranked),
        "top_score": ranked[0]["composite"] if ranked else 0,
        "ingestion_ms": ingestion_ms,
        "retrieval_ms": retrieval_ms,
        "reasoning_ms": reasoning_ms,
        "synthesis_ms": synthesis_ms,
        "total_ms": total_ms,
    }

# Execute demo queries
queries = [
    "What are the key risk factors across all financial documents?",
    "What is Tesla's revenue growth and forward guidance for 2025?",
    "What compliance and regulatory violations exist at Goldman Sachs?",
    "What are the sanctions and FCPA investigation details across firms?",
    "What is the commercial real estate risk exposure at JPMorgan?",
]

pipeline_results = []
for i, q in enumerate(queries):
    print(f"\n  {C.BOLD}{C.MAGENTA}[Query {i+1}/{len(queries)}]{C.RESET}")
    result = run_pipeline(q)
    pipeline_results.append(result)
    print(f"\n  {'─' * 60}")

# ═══ CELL 9: Compliance Scanner ══════════════════════════════════════════

section("COMPLIANCE SCANNER — Regulatory Pattern Matching", C.RED)

# Compliance patterns with severity classification
COMPLIANCE_PATTERNS = [
    # (Finding Name, Regex Pattern, Regulatory Reference, Severity, Description)
    ("Material Weakness",        r"material weakness",                     "SOX §404",            "Critical",
     "Deficiency in internal controls over financial reporting"),
    ("Sanctions Violation",      r"(?:sanctions|ofac)\s*(?:violation)?",   "OFAC / BSA",          "Critical",
     "Potential violation of sanctions or anti-money laundering laws"),
    ("FCPA Violation",           r"(?:fcpa|anti-?corruption|bribery)",     "FCPA / UK Bribery Act","Critical",
     "Foreign corrupt practices or bribery indicators"),
    ("Data Breach",              r"data breach",                           "SEC Cyber Rules",     "High",
     "Cybersecurity incident involving data compromise"),
    ("Regulatory Investigation",  r"(?:regulatory|sec|cftc)\s+investigat", "SEC / CFTC",          "High",
     "Active regulatory investigation or enforcement action"),
    ("Interest Rate Risk",       r"interest rate risk",                    "FRB SR 11-7",         "High",
     "Material interest rate risk exposure"),
    ("Credit Exposure",          r"credit exposure",                       "Basel III",           "Medium",
     "Significant credit risk concentration"),
    ("CRE Delinquency",          r"(?:cre|commercial real estate)\s+delinq","Dodd-Frank §165",    "Medium",
     "Rising commercial real estate delinquency rates"),
    ("Liquidity Shortfall",      r"(?:lcr|liquidity coverage)\s+\d+",      "Basel III LCR",       "Medium",
     "Liquidity coverage ratio below internal target"),
    ("Operational Loss",         r"operational (?:risk )?loss",            "Basel II OpRisk",     "Medium",
     "Material operational risk losses"),
    ("Climate Risk",             r"climate risk",                          "TCFD / SEC Climate",  "Medium",
     "Material climate-related financial risk"),
    ("Cybersecurity Incident",   r"cybersecurity incident",                "SEC Cyber Rules",     "High",
     "Significant cybersecurity threat or incident"),
    ("Forward Guidance",         r"forward guidance|guidance:",            "Reg FD",              "Low",
     "Forward-looking statements requiring safe harbor"),
]

severity_colors = {
    "Critical": C.RED,
    "High": C.YELLOW,
    "Medium": C.CYAN,
    "Low": C.GREEN,
}

findings = []
for chunk in all_chunks:
    for name, pattern, ref, severity, description in COMPLIANCE_PATTERNS:
        match = re.search(pattern, chunk["content"], re.IGNORECASE)
        if match:
            # Extract surrounding context
            start = max(0, match.start() - 50)
            end = min(len(chunk["content"]), match.end() + 80)
            excerpt = chunk["content"][start:end].replace('\n', ' ')
            if start > 0:
                excerpt = "..." + excerpt
            if end < len(chunk["content"]):
                excerpt = excerpt + "..."

            findings.append({
                "finding": name,
                "reference": ref,
                "severity": severity,
                "description": description,
                "source_doc": chunk["doc_title"],
                "ticker": chunk["ticker"],
                "chunk_index": chunk["chunk_index"],
                "excerpt": excerpt,
            })

# Sort by severity
severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
findings.sort(key=lambda f: (severity_order[f["severity"]], f["finding"]))

# Display compliance scan results
print(f"\n  {C.BOLD}Compliance Scan Results:{C.RESET}")
print(f"  {C.BOLD}{len(findings)} findings across {len(documents)} documents{C.RESET}\n")

# Summary by severity
sev_counts = Counter(f["severity"] for f in findings)
for sev in ["Critical", "High", "Medium", "Low"]:
    count = sev_counts.get(sev, 0)
    color = severity_colors[sev]
    bar = "█" * count
    print(f"    {color}{sev:<10}{C.RESET} │ {color}{bar}{C.RESET} {count}")
print()

# Detailed findings
print(f"  {C.BOLD}Detailed Findings:{C.RESET}\n")
for i, f in enumerate(findings):
    color = severity_colors[f["severity"]]
    print(f"    {color}● [{f['severity']}] {f['finding']}{C.RESET}")
    print(f"      Regulation: {C.BOLD}{f['reference']}{C.RESET}  |  Source: {C.GREEN}{f['ticker']}{C.RESET} — {f['source_doc']}")
    print(f"      Description: {f['description']}")
    print(f"      Excerpt: {C.DIM}\"{f['excerpt']}\"{C.RESET}")
    print()

# Compliance DataFrame
compliance_df = pd.DataFrame(findings)
if not compliance_df.empty:
    compliance_summary = compliance_df.groupby(["severity", "ticker"]).size().reset_index(name="count")
    compliance_pivot = compliance_summary.pivot_table(index="ticker", columns="severity",
                                                       values="count", fill_value=0)
    for col in ["Critical", "High", "Medium", "Low"]:
        if col not in compliance_pivot.columns:
            compliance_pivot[col] = 0
    compliance_pivot = compliance_pivot[["Critical", "High", "Medium", "Low"]]
    compliance_pivot["Total"] = compliance_pivot.sum(axis=1)

    print(f"  {C.BOLD}Compliance Summary by Entity:{C.RESET}\n")
    print(compliance_pivot.to_string())
    print()

# ═══ CELL 10: Visualizations ═════════════════════════════════════════════

section("GENERATING VISUALIZATIONS", C.CYAN)

fig, axes = plt.subplots(2, 2, figsize=(16, 12))
fig.suptitle("NEXUS — Agentic RAG Pipeline Analytics", fontsize=16, fontweight='bold', color='#1a1a2e')

# Plot 1: Chunk Distribution by Document
ax1 = axes[0, 0]
tickers = [d["ticker"] for d in documents]
chunk_counts = [len([c for c in all_chunks if c["ticker"] == t]) for t in tickers]
colors_bar = ['#0f9b8e', '#2196f3', '#ff6b35']
bars = ax1.bar(tickers, chunk_counts, color=colors_bar, edgecolor='white', linewidth=1.5)
ax1.set_title("Document Chunk Distribution", fontweight='bold', fontsize=12)
ax1.set_ylabel("Number of Chunks")
ax1.set_xlabel("Ticker")
for bar, count in zip(bars, chunk_counts):
    ax1.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.1,
             str(count), ha='center', va='bottom', fontweight='bold')
ax1.set_ylim(0, max(chunk_counts) + 2)
ax1.grid(axis='y', alpha=0.3)

# Plot 2: Pipeline Latency Breakdown
ax2 = axes[0, 1]
if pipeline_results:
    avg_retrieval = np.mean([r["retrieval_ms"] for r in pipeline_results])
    avg_reasoning = np.mean([r["reasoning_ms"] for r in pipeline_results])
    avg_synthesis = np.mean([r["synthesis_ms"] for r in pipeline_results])

    stages = ["Retrieval\n(TF-IDF)", "Reasoning\n(5-Signal)", "Synthesis\n(Gemini)"]
    times = [avg_retrieval, avg_reasoning, avg_synthesis]
    colors_latency = ['#2196f3', '#ff9800', '#4caf50']
    bars2 = ax2.barh(stages, times, color=colors_latency, edgecolor='white', linewidth=1.5)
    ax2.set_title("Avg. Pipeline Latency (ms)", fontweight='bold', fontsize=12)
    ax2.set_xlabel("Milliseconds")
    for bar, t in zip(bars2, times):
        ax2.text(bar.get_width() + max(times)*0.02, bar.get_y() + bar.get_height()/2.,
                 f'{t:.0f}ms', ha='left', va='center', fontweight='bold')
    ax2.grid(axis='x', alpha=0.3)

# Plot 3: Compliance Heatmap
ax3 = axes[1, 0]
if not compliance_df.empty:
    heat_data = compliance_pivot[["Critical", "High", "Medium", "Low"]].values
    im = ax3.imshow(heat_data, cmap='YlOrRd', aspect='auto')
    ax3.set_xticks(range(4))
    ax3.set_xticklabels(["Critical", "High", "Medium", "Low"])
    ax3.set_yticks(range(len(compliance_pivot.index)))
    ax3.set_yticklabels(compliance_pivot.index)
    ax3.set_title("Compliance Findings Heatmap", fontweight='bold', fontsize=12)
    # Add text annotations
    for i in range(heat_data.shape[0]):
        for j in range(heat_data.shape[1]):
            val = int(heat_data[i, j])
            color = 'white' if val > 3 else 'black'
            ax3.text(j, i, str(val), ha='center', va='center', fontweight='bold', color=color)
    plt.colorbar(im, ax=ax3, shrink=0.8)

# Plot 4: Relevance Score Distribution
ax4 = axes[1, 1]
all_scores = []
for r in pipeline_results:
    query = r["query"]
    raw = retrieve(query, top_k=8)
    ranked = reason_and_rank(query, raw)
    for item in ranked:
        all_scores.append(item["composite"])

if all_scores:
    ax4.hist(all_scores, bins=20, color='#6c5ce7', edgecolor='white', linewidth=1.2, alpha=0.85)
    ax4.axvline(np.mean(all_scores), color='#e74c3c', linestyle='--', linewidth=2, label=f'Mean: {np.mean(all_scores):.3f}')
    ax4.set_title("Relevance Score Distribution", fontweight='bold', fontsize=12)
    ax4.set_xlabel("Composite Score")
    ax4.set_ylabel("Frequency")
    ax4.legend()
    ax4.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig("nexus_pipeline_analytics.png", dpi=150, bbox_inches='tight')
plt.show()
status("Visualization saved to nexus_pipeline_analytics.png")

# ═══ CELL 11: Summary Dashboard ══════════════════════════════════════════

banner("NEXUS — PIPELINE EXECUTION SUMMARY", C.GREEN)

# Timing summary
if pipeline_results:
    avg_total = np.mean([r["total_ms"] for r in pipeline_results])
    max_total = max(r["total_ms"] for r in pipeline_results)
    min_total = min(r["total_ms"] for r in pipeline_results)

    print(f"  {C.BOLD}Pipeline Performance:{C.RESET}")
    print(f"    Queries executed:    {len(pipeline_results)}")
    print(f"    Avg total latency:   {avg_total:.0f}ms")
    print(f"    Min / Max latency:   {min_total}ms / {max_total}ms")
    print()

    # Per-query summary table
    print(f"  {C.BOLD}Query Results Summary:{C.RESET}\n")
    summary_table = pd.DataFrame([{
        "Query": r["query"][:50] + "..." if len(r["query"]) > 50 else r["query"],
        "Chunks": r["chunks_retrieved"],
        "Top Score": f"{r['top_score']:.3f}",
        "Retrieval (ms)": r["retrieval_ms"],
        "Reasoning (ms)": r["reasoning_ms"],
        "Synthesis (ms)": r["synthesis_ms"],
        "Total (ms)": r["total_ms"],
    } for r in pipeline_results])
    print(summary_table.to_string(index=False))
    print()

# Compliance summary
print(f"  {C.BOLD}Compliance Summary:{C.RESET}")
print(f"    Total findings:      {len(findings)}")
for sev in ["Critical", "High", "Medium", "Low"]:
    count = sev_counts.get(sev, 0)
    color = severity_colors[sev]
    print(f"    {color}{sev:<10}{C.RESET}          {count}")
print()

# Document stats
print(f"  {C.BOLD}Document Statistics:{C.RESET}")
print(f"    Total documents:     {len(documents)}")
print(f"    Total chunks:        {len(all_chunks)}")
print(f"    Total characters:    {sum(len(c['content']) for c in all_chunks):,}")
print(f"    Avg chunk size:      {np.mean([c['char_count'] for c in all_chunks]):.0f} chars")
print(f"    IDF vocabulary:      {len(idf_cache):,} terms")
print()

print(f"  {C.BOLD}{C.GREEN}✓ Pipeline execution complete.{C.RESET}")
print(f"  {C.DIM}All agents ran successfully. Review findings above for insights.{C.RESET}")

# ═══ CELL 12: Interactive Query Mode ═════════════════════════════════════

banner("NEXUS — Interactive Query Mode", C.CYAN)

print(f"  Ask any financial question. Type {C.BOLD}'quit'{C.RESET} or {C.BOLD}'exit'{C.RESET} to stop.\n")
print(f"  {C.DIM}Examples:{C.RESET}")
print(f"  {C.DIM}  • What are the cybersecurity risks across firms?{C.RESET}")
print(f"  {C.DIM}  • Compare revenue growth between Tesla and Goldman Sachs{C.RESET}")
print(f"  {C.DIM}  • What are the Basel III compliance concerns?{C.RESET}")
print()

while True:
    try:
        q = input(f"  {C.BOLD}{C.CYAN}❯ {C.RESET}").strip()
    except (EOFError, KeyboardInterrupt):
        break
    if q.lower() in ['quit', 'exit', 'q', '']:
        break
    if q:
        run_pipeline(q)
        print(f"\n  {'─' * 60}\n")

print(f"\n  {C.GREEN}Session ended. Thank you for using NEXUS!{C.RESET}")
