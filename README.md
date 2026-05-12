<div align="center">

# NEXUS

### Agentic Intelligence for Finance

*A multi-agent RAG platform for financial document analysis — built by a finance student who believes regulatory intelligence should be accessible, not enterprise-priced.*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## What Is This?

NEXUS is a **multi-agent Retrieval-Augmented Generation (RAG) platform** purpose-built for financial document analysis. Feed it 10-K filings, earnings reports, or risk assessments — ask a natural language question — and a coordinated pipeline of four specialized agents retrieves, ranks, reasons, and synthesizes a citation-grounded answer.

**Two modes of operation:**

| Mode | Description |
|------|-------------|
| **Demo Mode** | Pre-loaded with 3 sample financial documents (Tesla 10-K, Goldman Sachs Q4 earnings, JP Morgan risk assessment). Zero setup — hit the ground running. |
| **Test Mode** | Upload your own financial documents via the browser. Everything persists in localStorage — no database server, no config files, no deployment complexity. |

The entire stack runs client-side and deploys to Vercel on the free tier. A companion Google Colab notebook lets you run the same pipeline in Python with zero installation.

---

## Why This Matters

Financial analysts at institutional firms spend **6+ hours per filing** manually extracting risk factors, compliance red flags, and earnings signals from documents that are deliberately dense and opaque. Enterprise tools that automate this cost **$50K–$500K/year** in licensing.

NEXUS asks a different question: *What if a finance student could build a functional version of this capability using free-tier cloud infrastructure and an agentic workflow architecture?*

| Pain Point | NEXUS Approach |
|------------|----------------|
| Analysts read 200+ pages per filing | Query across documents in seconds |
| Risk factors buried in footnotes and MD&A | Automated compliance scanning with severity classification |
| Manual cross-filing comparison | Multi-document retrieval and synthesis |
| LLM hallucinations in financial context | Citation-grounded responses with source tracking |
| Enterprise tooling is cost-prohibitive | Free-tier compatible: Gemini API + Vercel + Colab = $0 |

---

## Architecture — The Agentic Pipeline

The core design decision was decomposing financial document analysis into **four discrete agent responsibilities**, each with a defined input contract, processing logic, and output contract. This isn't arbitrary layering — it mirrors how a human analyst actually works: read → find → evaluate → write.

```
                          NEXUS AGENTIC PIPELINE

  ┌──────────────────────────────────────────────────────────────────────┐
  │                                                                      │
  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │  │  INGESTION   │────▶│  RETRIEVAL   │────▶│  REASONING   │────▶│  SYNTHESIS   │
  │  │   AGENT      │     │   AGENT      │     │   AGENT      │     │   AGENT      │
  │  ├─────────────┤     ├─────────────┤     ├─────────────┤     ├─────────────┤
  │  │              │     │              │     │              │     │              │
  │  │  Section     │     │  TF-IDF      │     │  Top-K       │     │  Gemini 2.0  │
  │  │  Boundary    │     │  Scoring     │     │  Selection   │     │  Flash LLM   │
  │  │  Detection   │     │              │     │              │     │              │
  │  │              │     │  Section     │     │  Confidence  │     │  Citation    │
  │  │  Semantic    │     │  Heading     │     │  Scoring     │     │  Grounded    │
  │  │  Chunking    │     │  Bonus       │     │              │     │  Analysis    │
  │  │              │     │              │     │  Relevance   │     │              │
  │  │  Context     │     │  Stop-Word   │     │  Normalized  │     │  Structured  │
  │  │  Overlap     │     │  Filtering   │     │  Ranking     │     │  Output      │
  │  │              │     │              │     │              │     │              │
  │  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
  │        │                    │                    │                    │
  │   Raw Document          Scored               Top-K Chunks       Citation-
  │   → Chunks              Chunks               + Confidence        Grounded
  │                                              Score               Response
  └──────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────────┐
  │  COMPLIANCE SCANNER (Parallel Agent)                                 │
  │                                                                      │
  │  Pattern matching against: SEC Reg S-K │ SOX §404 │ FCPA │ OFAC     │
  │                            GDPR │ Basel III │ ASC Standards          │
  │                                                                      │
  │  Output: Severity-classified findings (Critical/High/Medium/Low)     │
  └──────────────────────────────────────────────────────────────────────┘
```

---

## Agent Descriptions

### Agent 1 — Ingestion Agent

**Responsibility:** Transform raw financial document text into semantically coherent chunks that preserve meaning across boundaries.

Financial documents have structure — sections, items, parts. A naive character-count splitter would break mid-sentence in the middle of a risk factor, destroying the context an analyst needs. The Ingestion Agent solves this with a three-level fallback strategy:

1. **Section boundary detection** — Regex patterns recognize `ITEM 1A`, `PART II`, `SECTION 3`, Markdown headings, and numbered section headers common in SEC filings
2. **Paragraph boundary splitting** — Within sections, text splits on double newlines; overly long paragraphs (>1500 chars) fall back to sentence-level splitting
3. **Context overlap** — Each chunk carries an 80-word tail from the previous chunk, ensuring that cross-boundary information (like a risk factor that spans two paragraphs) isn't lost

Chunk metadata tracks word count, character count, and section heading — all used downstream by the Retrieval and Reasoning agents.

### Agent 2 — Retrieval Agent

**Responsibility:** Score every chunk against the user's query and surface the most relevant passages.

The Retrieval Agent implements a **TF-IDF inspired scoring algorithm** with two finance-specific enhancements:

- **Section-heading bonus (1.5x multiplier):** If a query asks about "risk factors" and a chunk's section heading contains "risk," that chunk is boosted — because in financial documents, section headings are high-signal metadata, not decoration
- **Stop-word filtering:** A 70+ word stop list strips low-signal terms before scoring, reducing noise from legal boilerplate language ("the," "pursuant," "herein")

The scoring formula: for each query term *t*, compute `TF(t, chunk) × IDF(t, corpus)`, sum across all query terms, then **normalize by √(chunk length)** to prevent long chunks from dominating simply because they contain more words.

### Agent 3 — Reasoning Agent

**Responsibility:** Select the optimal evidence set and quantify confidence.

From the ranked candidate pool, the Reasoning Agent:

1. **Selects Top-K chunks** (K=8 by default) — balancing breadth of evidence against LLM context window constraints
2. **Filters zero-score chunks** — if no chunk scored above zero for the query, the system falls back to the top 5 candidates rather than returning nothing (a pragmatic choice: partial evidence beats no evidence)
3. **Computes a confidence score** — `min(0.99, max(0.1, average_score / 10))` — calibrated to avoid false precision. This isn't a statistical confidence interval; it's a normalized relevance signal that tells the user how strongly the evidence maps to their question

### Agent 4 — Synthesis Agent

**Responsibility:** Transform the evidence set into a structured, citation-grounded financial analysis.

The Synthesis Agent sends the top-K chunks to **Google Gemini 2.0 Flash** with a strict system prompt that enforces:

- **Source-only reasoning:** Never fabricate data. If the documents don't contain the answer, say so explicitly
- **Citation discipline:** Every factual claim tagged with `[Source X]` notation mapping back to the specific chunk
- **Structured output:** Key Findings → Evidence → Risk Assessment → Limitations
- **Conflict detection:** If multiple documents contain contradictory data, the system highlights the discrepancy

This is the only agent that calls an external LLM — and it's gatekept behind the three prior agents so that the model only sees pre-filtered, high-relevance context. This architecture decision dramatically reduces hallucination surface area compared to naive "paste the whole document into ChatGPT" approaches.

### Compliance Scanner — Parallel Agent

**Responsibility:** Detect regulatory compliance red flags across all document chunks.

Runs independently of the query pipeline. Uses regex pattern matching against **30+ compliance patterns** organized into four categories:

| Category | Regulations Covered | Example Detection |
|----------|-------------------|-------------------|
| Risk Disclosure | SEC Reg S-K Items 103, 105; ASC 205-40 | Material weakness in internal controls |
| Financial Reporting | SEC Form 8-K Item 4.02; ASC 360-10, ASC 850 | Restatement of financial results |
| Regulatory Compliance | FCPA, OFAC, GDPR, CCPA | Sanctions/embargo references |
| Market Risk | Basel III, SEC Reg S-K Item 305, CCAR | Counterparty credit risk exposure |

Each finding is severity-classified (Critical → Low) with a regulatory reference and an excerpt showing the matched text in context.

---

## Features

### Intelligent Query Engine
- Natural language questions across all uploaded documents
- Real-time agent execution trace — watch each pipeline step complete
- Citation-grounded responses with source chunk tracking
- Confidence scoring and end-to-end pipeline latency metrics

### Regulatory Compliance Scanner
- 30+ compliance pattern detectors across 6 regulatory frameworks
- Severity classification: Critical / High / Medium / Low
- Four scan categories: Risk Disclosure, Financial Reporting, Regulatory Compliance, Market Risk
- Regulatory references included with every finding (e.g., "SOX Section 404", "FCPA")

### Financial Document Intelligence
- Upload 10-K filings, earnings reports, risk assessments via browser
- Semantic chunking with section-aware boundary detection
- Multi-document cross-referencing in a single query
- Document management with chunk-level tracking

### Zero-Infrastructure Deployment
- No database server — client-side persistence via localStorage
- Vercel-deployable on the free tier
- Google Colab compatible — complete Python notebook included
- Free-tier LLM: Google Gemini 2.0 Flash API (no cost at typical usage levels)

---

## Tech Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | Next.js 16 | Server-side rendering, API routes, React Server Components |
| Language | TypeScript | Type safety across the agent pipeline contracts |
| Styling | Tailwind CSS 4 + shadcn/ui | Professional, accessible, production-quality components |
| LLM | Google Gemini 2.0 Flash | Free-tier, low-latency, strong instruction following |
| Charts | Recharts | React-native charting for analytics dashboards |
| Animations | Framer Motion | Smooth, professional transitions |
| Deployment | Vercel | Zero-config deploy, free tier, edge-optimized |
| Python | Google Colab | Zero-install pipeline execution in notebook environment |

**Cost-performance architecture:** Every component in this stack operates on a free tier. The entire system — from ingestion to LLM synthesis — runs at **$0 operational cost** for typical academic and portfolio use cases. This wasn't an afterthought; it was a core design constraint from day one.

---

## Getting Started

### Prerequisites
- Node.js 18+ or [Bun](https://bun.sh/)
- A free [Google Gemini API key](https://aistudio.google.com/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/mellowedbo/RAG-PROJECT.git
cd RAG-PROJECT

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The platform auto-seeds with 3 sample financial documents on first load — you can start querying immediately in Demo Mode.

To analyze your own documents, switch to Test Mode and upload directly through the browser. All data persists in localStorage — no configuration needed.

### Environment Setup

Create a `.env.local` file with your Gemini API key:

```env
GEMINI_API_KEY=your_free_api_key_here
```

Get a free key at [Google AI Studio](https://aistudio.google.com/apikey) — no credit card required.

---

## Google Colab

Can't run Node.js locally? The complete agentic pipeline runs in a **Google Colab notebook** — zero installation, free GPU runtime.

### Quick Start

1. Open [Google Colab](https://colab.research.google.com/)
2. Download the notebook from the app's "Colab" tab, or grab `nexus_agentic_rag_colab.py` from this repo
3. Run each cell sequentially
4. Paste your own financial document text and query it

### What You Get in Colab

| Feature | Colab Version | Web App Version |
|---------|--------------|-----------------|
| Semantic Chunking | ✅ | ✅ |
| TF-IDF Retrieval | ✅ | ✅ |
| LLM Synthesis (Gemini) | ✅ | ✅ |
| Compliance Scanner | ✅ | ✅ |
| Browser UI | ❌ (notebook interface) | ✅ |
| Document Upload | 📎 From Google Drive | 📤 Browser upload |
| Cost | Free | Free |

---

## My Role

I'm a **BBA Finance student** who designed and built NEXUS to prove a point: you don't need a $200K enterprise contract to do intelligent financial document analysis. You need the right architecture.

### Agentic Workflow Design & Architecture Decisions

The core intellectual contribution of this project is the **4-agent pipeline decomposition**. I didn't start by choosing technologies — I started by studying how financial analysts actually work:

1. **Read** the document, noting sections and structure → *Ingestion Agent*
2. **Find** the passages relevant to the question → *Retrieval Agent*
3. **Evaluate** which evidence is strongest → *Reasoning Agent*
4. **Write** a structured analysis citing sources → *Synthesis Agent*

Each agent has a single responsibility, a defined input/output contract, and operates independently. This separation isn't just clean software design — it's **observable**. When a query returns a poor result, the agent trace tells you exactly which stage failed: was the chunking wrong, the retrieval weak, the ranking off, or the synthesis hallucinating? You can't debug what you can't see.

### ML/AI Application in the Finance Domain

Every design choice in this system is grounded in domain knowledge, not generic ML patterns:

- **Section-heading bonus in retrieval** exists because I've read enough 10-Ks to know that `ITEM 1A. RISK FACTORS` is the single most informative string in the entire filing — it should be weighted accordingly
- **Context overlap at chunk boundaries** exists because risk factor discussions in SEC filings routinely span paragraph breaks; losing the connecting context between Chunk N and Chunk N+1 would destroy the meaning
- **Compliance scanner categories** map directly to the regulatory frameworks covered in my coursework: SOX Section 404 (internal controls), FCPA (anti-corruption), OFAC (sanctions), Basel III (capital adequacy), GDPR/CCPA (data privacy), SEC Regulation S-K (disclosure requirements)
- **Confidence scoring is intentionally conservative** — `max(0.1)` floor and `min(0.99)` cap — because false precision in financial analysis is worse than admitted uncertainty

### Business Analysis → Technical Capability Translation

This project required translating business requirements into system behavior:

| Business Requirement | Technical Implementation |
|---------------------|------------------------|
| "Analysts need to find risk factors fast" | Section-aware retrieval with heading bonus |
| "We can't trust AI that makes things up" | Citation-grounded synthesis with source-only constraint |
| "Compliance gaps get us fined" | Parallel compliance scanner with severity classification |
| "Our team isn't technical" | Browser-based UI, zero-config deployment, Colab notebook |
| "We can't justify a $100K tool" | Free-tier stack: Gemini + Vercel + localStorage |

The compliance scanner is a direct translation of something I observed in my internship: compliance officers manually searching PDFs for keywords like "material weakness" and "related party transaction." That's a pattern-matching problem. It shouldn't require a human reading at 2 AM.

### Cost-Performance Optimization Strategy

This is where my finance background directly influenced the architecture:

- **TF-IDF over embedding models:** For a portfolio project running on free infrastructure, a statistical scoring algorithm that runs in milliseconds with zero model downloads outperforms a 384-dimensional embedding model that requires GPU inference — especially when the document corpus is small (tens of documents, not millions). The retrieval quality is "good enough for the use case" at a fraction of the computational cost.

- **Client-side storage over database servers:** localStorage isn't architecturally elegant, but it's **zero-cost and zero-config**. For the target user (a student, analyst, or small team testing the concept), the trade-off is correct: sacrifice multi-user concurrency for zero operational overhead.

- **Gemini 2.0 Flash over larger models:** Flash is optimized for latency, not depth. For structured extraction tasks (find the number, cite the source, flag the risk), that's the right trade. You don't need GPT-4-level reasoning to extract "revenue was $96.8 billion" from a 10-K and cite it.

- **Pre-filtering before LLM:** The three agents before Synthesis exist to minimize the LLM's input context. Smaller context → faster response → lower API cost → more queries on the free tier. This is cost engineering, not just software engineering.

The total operational cost of this system is **$0/month** at typical usage levels. That's not an accident — it's the design constraint that shaped every architectural decision.

---

## Use Cases

### Earnings Analysis
Upload quarterly earnings transcripts and ask: *"What was the revenue growth and forward guidance?"* — get a structured answer citing specific numbers from the filing.

### Risk Assessment
Upload a 10-K and ask: *"What are the key risk factors?"* — the compliance scanner automatically flags material weaknesses, going concern issues, and regulatory proceedings.

### Regulatory Compliance
Upload multiple filings and run the compliance scanner — it identifies potential violations across SOX, FCPA, OFAC, and SEC regulations with severity ratings and regulatory references.

### Portfolio Due Diligence
Upload investment documents and ask: *"What is the credit risk exposure?"* — cross-reference risk disclosures across multiple companies in a single query.

---

## License

[MIT](LICENSE)

---

*Built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Framer Motion, and Google Gemini.*
