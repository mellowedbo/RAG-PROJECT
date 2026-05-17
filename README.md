# NEXUS — Financial Intelligence Platform

> Multi-Agent RAG Pipeline for Enterprise Financial Document Analysis

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4)](https://ai.google.dev/)

## Overview

NEXUS is a production-ready financial intelligence platform that combines Retrieval-Augmented Generation (RAG) with domain-specific financial tools. It features a 4-agent agentic pipeline — Ingestion → Retrieval → Reasoning → Synthesis — powered by Google Gemini AI.

**Key Capabilities:**
- 📄 Document Intelligence — Upload 10-K filings, earnings reports, risk assessments; auto-chunk, embed, and index
- 🔍 Semantic Search — Vector similarity + TF-IDF hybrid retrieval with Gemini Embedding 2
- 🧠 AI Analysis — Gemini-powered synthesis with cited sources and confidence scoring
- 📒 Double-Entry Accounting — Journal entries, trial balance, issue scanning (Indian accounting standards)
- 🏦 Tax Intelligence — Income tax (old/new regimes), GST, TDS calculators (FY 2024-25)
- 📊 Financial Analysis — 19 ratio calculations, DuPont decomposition, SWOT analysis
- 🤖 Model Health Check — Auto-detect which Gemini models are available in your region

## Architecture

```
[4-Agent Pipeline Diagram]

Ingestion → Retrieval → Reasoning → Synthesis
   ↓            ↓           ↓           ↓
Chunk+Embed  Vector/TF-IDF  LLM Context  Cited Response
```

The pipeline is designed for full observability. When a query returns a poor result, the agent trace shows exactly which stage failed — was the chunking wrong, the retrieval weak, the ranking off, or the synthesis hallucinating? Each agent has a single responsibility and a defined input/output contract.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **AI**: Google Gemini 2.5 Flash/Pro + Gemini Embedding 2
- **Vector Store**: In-memory FAISS-like + localStorage/IndexedDB
- **Database**: Prisma ORM (SQLite)
- **Deployment**: Vercel (standalone output)

## Supported AI Models

### Embedding Models
| Model | Dimensions | Max Tokens | Notes |
|-------|-----------|------------|-------|
| Gemini Embedding 2 | 128–3072 | 8192 | Recommended, multimodal |
| Gemini Embedding Exp 03-07 | 3072 | 8192 | Experimental |
| text-embedding-004 | 768 | 2048 | Stable, text-only |

### Generation Models
| Model | Output Tokens | Notes |
|-------|--------------|-------|
| Gemini 2.5 Flash | 65536 | Recommended, adaptive thinking |
| Gemini 2.5 Pro | 65536 | Most capable, deep thinking |
| Gemini 2.0 Flash | 8192 | Fast, widely available |
| Gemini 2.0 Flash Lite | 8192 | Lightweight |
| Gemma 3 27B/12B/4B IT | 8192 | Open-weight, region-restricted |

> **Model Health Check**: The platform includes a built-in model availability tester that checks which models work in your region with your API key. Find it in Settings → Model Selection → Test Model Availability.

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Google Gemini API key ([Get one free](https://aistudio.google.com/apikey))

### Quick Start (Vercel Deployment)
1. Fork this repository
2. Import to [Vercel](https://vercel.com)
3. Deploy — no environment variables needed (API key is entered in the UI)

### Local Development
```bash
# Clone
git clone https://github.com/mellowedbo/RAG-PROJECT.git
cd RAG-PROJECT

# Install
bun install

# Run
bun run dev

# Open http://localhost:3000
```

### Google Colab (Production Pipeline)
See the **Colab** tab in the app for a self-contained Python notebook that runs the RAG pipeline in Google Colab with GPU acceleration.

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── gemini/route.ts          # Gemini API proxy with fallback chain
│   │   ├── extract/route.ts         # PDF/DOCX/TXT text extraction
│   │   ├── models/health/route.ts   # Model availability health check
│   │   ├── seed/route.ts            # Database seeding & management
│   │   └── compliance-scan/route.ts  # Document compliance scanning
│   ├── layout.tsx                    # Root layout with theme support
│   └── page.tsx                      # Main application page
├── components/
│   ├── DashboardView.tsx             # Overview & pipeline status
│   ├── DocumentsView.tsx             # Document upload & management
│   ├── QueryView.tsx                 # RAG query interface
│   ├── AccountingView.tsx            # Double-entry bookkeeping
│   ├── TaxView.tsx                   # Indian tax calculators
│   ├── AnalysisView.tsx              # Financial ratio analysis
│   ├── SettingsView.tsx              # Configuration & model health
│   ├── Navigation.tsx                # Top nav with tab routing
│   └── ColabView.tsx                 # Colab notebook viewer
├── hooks/
│   └── useRAGPipeline.ts            # Core RAG pipeline state management
├── lib/
│   ├── chunker.ts                    # Recursive text chunker
│   ├── retriever.ts                  # TF-IDF + embedding retrieval
│   ├── embeddings.ts                 # Gemini embedding client
│   ├── vectordb.ts                   # In-memory vector database
│   ├── compliance.ts                 # Compliance pattern scanner
│   ├── storage.ts                    # localStorage/IndexedDB abstraction
│   └── demoData.ts                   # Pre-loaded demo documents
└── types/
    └── index.ts                      # Shared type definitions & model catalog
```

## Features Detail

### 🔍 RAG Query Pipeline
The 4-agent pipeline processes queries through:
1. **Ingestion Agent** — Document parsing, section-aware chunking (800 chars, 120 overlap)
2. **Retrieval Agent** — Vector similarity (cosine) or TF-IDF keyword matching fallback
3. **Reasoning Agent** — Context assembly from top-K ranked chunks
4. **Synthesis Agent** — Gemini LLM generates cited, evidence-grounded response

### 📒 Accounting (Indian Standards)
- 33-account chart following Indian accounting conventions
- Manual and AI-powered journal entry creation
- Natural language parsing: "Pay rent ₹50,000" → debit Rent, credit Bank
- Trial balance computation and imbalance detection
- 7 automated issue checks (unbalanced entries, revenue misclassification, etc.)
- RAG integration: search uploaded documents for accounting data

### 🏦 Tax Intelligence (FY 2024-25)
- **Income Tax**: Old regime (3 age-based slab variants) vs New regime (6 slabs)
- Section 87A rebate, 4% health & education cess, surcharge calculation
- Side-by-side regime comparison with savings recommendation
- **GST Calculator**: CGST/SGST or IGST, inclusive/exclusive pricing
- **TDS Rate Lookup**: 28 sections with rates, thresholds, and special notes
- RAG integration: search documents for tax-related content

### 📊 Financial Analysis
- 19 financial ratios across 5 categories (liquidity, profitability, leverage, efficiency, market)
- Benchmark comparison for each ratio
- Automatic SWOT analysis from computed ratios
- Balance sheet text parser (AI or regex)
- RAG integration: apply financial data from uploaded documents

### 🤖 Model Health Check
The platform includes a built-in model availability tester:
- Tests each Gemini model with a minimal API call
- Shows latency, availability status, and error messages
- Auto-suggests switching to an available model if your selection is unavailable
- Results cached for 5 minutes

## Deployment Stages

### Stage 1: Trial / Demo (Vercel)
- Free deployment on Vercel
- No server-side API key storage — users enter keys in the UI
- 10 requests/day rate limit for demo usage
- Pre-loaded demo documents for immediate exploration
- **Best for**: Trying the platform, demos, proof-of-concept

### Stage 2: Self-Hosted (Docker/VPS)
- Use the standalone output for containerized deployment
- Set `GEMINI_API_KEY` environment variable for server-side key management
- Configure rate limits and authentication as needed
- **Best for**: Teams, internal tools, production workloads

### Stage 3: Production (Google Colab)
- Full Python RAG pipeline in Google Colab
- GPU-accelerated embedding generation
- No deployment needed — runs in Colab's cloud environment
- See the **Colab** tab for the complete notebook
- **Best for**: Batch processing, research, large-scale analysis

## Security Considerations

- API keys are stored in browser localStorage (not sent to our servers)
- All Gemini API calls go through a server-side proxy (keys never appear in browser network logs)
- Rate limiting prevents abuse (10 req/day for demo, configurable for self-hosted)
- No authentication on API routes in demo mode — add authentication for production

## Limitations

- **localStorage** has a ~5MB limit; large document sets may hit this (IndexedDB fallback available)
- **Gemma models** are region-restricted and may not be available in all locations
- **Simulation mode** uses deterministic mock embeddings — not semantically meaningful
- **Single-user** architecture — no multi-user collaboration or real-time sync

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for the foundation models
- [Next.js](https://nextjs.org/) for the React framework
- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Vercel](https://vercel.com/) for hosting
