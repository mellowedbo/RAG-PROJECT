# NEXUS — Agentic Intelligence for Finance

> A multi-agent Retrieval-Augmented Generation (RAG) platform designed for institutional financial document analysis. Upload 10-K filings, earnings reports, and risk assessments — ask questions, get citation-grounded answers.

---

## What Is This?

NEXUS is a **financial intelligence platform** that lets analysts, compliance officers, and portfolio managers query across multiple financial documents simultaneously. Instead of manually reading through hundreds of pages, you ask a question and the system:

1. **Searches** across all uploaded documents using hybrid keyword + semantic retrieval
2. **Ranks** the most relevant passages using TF-IDF scoring
3. **Synthesizes** a structured analysis using an LLM — with citations back to the source
4. **Scans** for regulatory compliance red flags (SOX, FCPA, OFAC, SEC, GDPR)

No more reading 200-page 10-K filings to find the risk section. Ask, and get answers grounded in the actual document text.

---

## Why This Matters (Business Case)

| Problem | NEXUS Solution |
|---------|---------------|
| Analysts spend 6+ hours reading filings | Query across documents in seconds |
| Risk factors buried in footnotes | Automated compliance scanning flags critical items |
| Manual cross-document comparison | Multi-document retrieval and synthesis |
| LLM hallucinations in financial analysis | Citation-grounded responses with source tracking |
| Expensive enterprise tools | Free-tier compatible, runs on Google Colab |

---

## Architecture — The Agentic Workflow

The system uses a **4-agent sequential pipeline** — each agent optimized for a specific phase:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  INGESTION   │───▶│  RETRIEVAL   │───▶│  REASONING   │───▶│  SYNTHESIS   │
│   AGENT      │    │   AGENT      │    │   AGENT      │    │   AGENT      │
├─────────────┤    ├─────────────┤    ├─────────────┤    ├─────────────┤
│ Semantic     │    │ Hybrid FTS  │    │ TF-IDF      │    │ LLM         │
│ Chunking     │    │ + Keyword   │    │ Ranking     │    │ Synthesis   │
│              │    │ Search      │    │             │    │ + Citations │
│ Section      │    │             │    │ Top-K       │    │             │
│ Detection    │    │ 50+50       │    │ Selection   │    │ Structured  │
│              │    │ Candidates  │    │             │    │ Output      │
│ Context      │    │             │    │ Confidence  │    │             │
│ Overlap      │    │ Dedup       │    │ Scoring     │    │ Source      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Agent Details

**Ingestion Agent** — Semantic chunking with section boundary detection. Cuts by meaning (topic shifts between paragraphs), not by arbitrary character count. Maintains context overlap between chunks to prevent information loss at boundaries.

**Retrieval Agent** — Dual-channel search: full-text keyword search (for exact term matching like "material weakness") AND semantic similarity search. Results are deduplicated and merged before ranking.

**Reasoning Agent** — TF-IDF inspired scoring with section-heading bonus. Ranks retrieved chunks by relevance to the query, selects the top-K most informative passages, and calculates confidence scores.

**Synthesis Agent** — LLM-powered analysis grounded in the retrieved evidence. Every claim is tagged with a citation [Source X]. If the documents don't contain enough information, the system says so — no hallucination.

---

## Features

### 🔍 Intelligent Query Engine
- Ask natural language questions across all uploaded documents
- Real-time agent execution trace showing each pipeline step
- Citation-grounded responses with source tracking
- Confidence scoring and pipeline metrics

### 🛡️ Regulatory Compliance Scanner
- Automated detection of 30+ compliance patterns
- Covers: SEC Regulation S-K, SOX Section 404, FCPA, OFAC, GDPR, Basel III
- Severity classification: Critical / High / Medium / Low
- Pattern categories: Risk Disclosure, Financial Reporting, Regulatory Compliance, Market Risk

### 📊 Financial Document Intelligence
- Upload 10-K filings, earnings reports, risk assessments
- Semantic chunking with section awareness
- Multi-document cross-referencing
- Document management with chunk-level tracking

### 📓 Google Colab Compatible
- Complete pipeline runs on free Google Colab
- No API keys needed for core functionality
- Open-source models: FastEmbed (BAAI/bge-small-en-v1.5), FlashRank (TinyBERT-L-2)
- Serverless vector DB: LanceDB

---

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | Next.js 16 + TypeScript | Server-side rendering, API routes |
| UI | Tailwind CSS + shadcn/ui | Professional, accessible components |
| Database | Prisma + SQLite | Type-safe ORM, zero-config DB |
| Vector Search | LanceDB | Serverless, hybrid FTS + vector |
| Embeddings | FastEmbed (BAAI/bge-small-en-v1.5) | 384-dim, CPU-optimized |
| Reranking | FlashRank (TinyBERT-L-2) | ~4MB, instant on CPU |
| LLM | z-ai-web-dev-sdk | Production LLM API |
| Charts | Recharts | React-native charting |
| Animations | Framer Motion | Smooth, professional transitions |

---

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm/bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/mellowedbo/RAG-PROJECT.git
cd RAG-PROJECT

# Install dependencies
npm install

# Set up the database
npx prisma db push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the platform auto-seeds with 3 sample financial documents on first load.

### Google Colab (No Installation Required)

1. Open Google Colab
2. Copy the notebook code from the "Colab" tab in the app
3. Run each cell sequentially
4. Paste your own financial documents and query them

---

## Use Cases

### 📈 Earnings Analysis
Upload quarterly earnings transcripts and ask: *"What was the revenue growth and forward guidance?"* — get a structured answer citing specific numbers from the filing.

### 🛡️ Risk Assessment
Upload a 10-K and ask: *"What are the key risk factors?"* — the compliance scanner automatically flags material weaknesses, going concern issues, and regulatory proceedings.

### 📋 Regulatory Compliance
Upload multiple filings and run the compliance scanner — it identifies potential violations across SOX, FCPA, OFAC, and SEC regulations with severity ratings and references.

### 💼 Portfolio Due Diligence
Upload investment documents and ask: *"What is the credit risk exposure?"* — cross-reference risk disclosures across multiple companies.

---

## My Role

This project demonstrates competencies in:

- **Agentic Workflow Design**: Architected the 4-agent pipeline (Ingestion → Retrieval → Reasoning → Synthesis), defining data flow, agent responsibilities, and the hybrid retrieval strategy
- **ML/AI Application in Finance**: Applied semantic chunking, TF-IDF retrieval, and LLM synthesis to solve real institutional finance problems — 10-K analysis, compliance scanning, earnings interpretation
- **Business & Financial Analysis**: Translated financial domain requirements (compliance, risk, earnings) into technical system capabilities, ensuring the architecture solves real analyst workflows
- **Systems Thinking**: Designed the cost-performance optimization strategy — free-tier compatible stack, TF-IDF scoring with section-heading bonus, context overlap for chunk boundary preservation
- **Scalable Architecture**: Built for scaling from Google Colab (free) to production deployment — same API, zero code changes

---

## License

MIT

---

## Acknowledgments

Built with open-source tools: LanceDB, FastEmbed, FlashRank, Next.js, Prisma, and shadcn/ui.
