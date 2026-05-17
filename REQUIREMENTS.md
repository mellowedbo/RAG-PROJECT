# NEXUS — Requirements & Implementation Audit

## Project Overview
**NEXUS — Agentic Intelligence for Finance**: A comprehensive Finance AI Platform combining RAG (Retrieval-Augmented Generation), Accounting Intelligence, Tax Computation, and Financial Analysis — powered by Google Gemini models.

**Target User**: BBA Finance student who understands agentic workflows and ML applications.
**Deployment**: Vercel (free tier) + GitHub (`mellowedbo/RAG-PROJECT`)
**Constraints**: Only free services (Google Gemini API free tier, open-source models)

---

## Feature Requirements

### 1. Model Selection UI (ALL available models)
**Status**: ✅ Partially implemented — needs expansion

**Current**: 2 embedding + 5 generation models
**Required**: All available Gemini models the user can choose from

**Embedding Models Required**:
- ✅ `gemini-embedding-2` (3072-dim, multimodal, recommended)
- ✅ `text-embedding-004` (768-dim, text-only)
- ❌ `gemini-embedding-exp-03-07` (experimental)
- ❌ `text-embedding-004` already listed

**Generation Models Required**:
- ✅ `gemma-4-31b-it` (Dense 30.7B, recommended)
- ✅ `gemma-4-26b-a4b-it` (MoE 26B/4B active)
- ✅ `gemini-2.5-flash-preview-05-20`
- ✅ `gemini-2.0-flash`
- ✅ `gemini-2.0-flash-lite`
- ❌ `gemma-3-27b-it`
- ❌ `gemma-3-12b-it`
- ❌ `gemma-3-4b-it`
- ❌ `gemma-3-1b-it`
- ❌ `gemini-2.5-pro-preview-05-06`

### 2. RAG Pipeline (4-Agent Architecture)
**Status**: ✅ Working

- ✅ Ingestion: File upload (PDF/DOCX/TXT) + text paste
- ✅ Chunking: Recursive character splitter with section awareness
- ✅ Embeddings: Gemini Embedding 2 via /api/gemini proxy
- ✅ Vector DB: In-memory cosine similarity (brute-force, functional for demo)
- ✅ Retrieval: Embedding-based + TF-IDF fallback
- ✅ Reasoning: Context assembly from top-K chunks
- ✅ Synthesis: Gemma 4 31B IT LLM response generation
- ✅ Agent trace UI showing all 4 pipeline steps
- ✅ Simulation mode for testing without API calls
- ✅ Rate limiting (10 req/day)

### 3. Accounting Intelligence
**Status**: ✅ Fully implemented

- ✅ Double-entry journal entry creation (manual form)
- ✅ 40+ account catalog (Indian accounting context with GST accounts)
- ✅ Natural language entry parsing via LLM
- ✅ Trial balance computation
- ✅ Issue scanner (7 check types: unbalanced, misclassification, negative balances, unusual combos, missing contras, trial balance check)
- ✅ AI-powered analysis via Gemini
- ✅ localStorage persistence

### 4. Tax Computation
**Status**: ✅ Fully implemented

- ✅ Indian Income Tax Calculator (FY 2024-25): Old & New regime
- ✅ Age-based slabs, Section 87A rebate, surcharge, 4% cess
- ✅ Regime comparison with savings calculation
- ✅ GST Calculator: CGST/SGST, IGST, inclusive/exclusive
- ✅ TDS Rate Lookup: 27 TDS sections
- ✅ AI Tax Assistant tab

### 5. Financial Analysis
**Status**: ✅ Fully implemented

- ✅ 18 financial ratio calculations across 5 categories
- ✅ Health interpretation with benchmarks
- ✅ Balance sheet parser (AI + regex fallback)
- ✅ RAG document analysis
- ✅ AI SWOT analysis
- ✅ Sample data loader

### 6. Compliance (User says "useless")
**Status**: ⚠️ Implemented but disconnected from navigation

**User Request**: Replace or significantly downgrade compliance
**Decision**: Keep as a sub-feature within Analysis (not a main tab), since the Accounting issue scanner already covers improper accounting detection

### 7. Colab Notebook
**Status**: ✅ Working — embedded Python notebook with copy/download

### 8. Settings & Configuration
**Status**: ✅ Fully implemented

- ✅ API key management
- ✅ Model selection (embedding + generation)
- ✅ Embedding dimensions (128-3072)
- ✅ Task type selection
- ✅ Simulation mode toggle
- ✅ Embedding mode toggle
- ✅ Chunk size/overlap/Top-K configuration
- ✅ Data export/clear
- ✅ Storage usage monitoring

---

## Bug Fixes Required

### 🔴 Critical: Hydration Mismatch
**File**: `src/hooks/useRAGPipeline.ts` lines 96-107
**Problem**: `apiKey` and `config` loaded from localStorage during `useState` initializer. On server, they're empty/default. On client, they have saved values. This causes SSR/client HTML mismatch.
**Fix**: Initialize with defaults, load from localStorage in `useEffect`

### 🔴 Critical: Hydration Mismatch in SettingsView
**File**: `src/components/SettingsView.tsx` line 81
**Problem**: `storageMB` computed from localStorage during `useState` initializer
**Fix**: Initialize with '0.00', compute in `useEffect`

### 🟡 Medium: Duplicate Code
- Two chunkers: `src/lib/chunker.ts` and `src/lib/rag/chunker.ts`
- Two compliance scanners: `src/lib/compliance.ts` and `src/lib/rag/compliance.ts`
- `src/lib/finance-data.ts` contains fake metrics that don't reflect reality

### 🟡 Medium: Missing Model Options
- User explicitly asked for ALL model options including Gemma 3 variants
- Need to add more models to the catalog

---

## Architecture Decisions

1. **Vector DB**: In-memory brute-force cosine similarity is acceptable for demo (works for <10K chunks)
2. **No FAISS in browser**: FAISS requires native bindings; our in-memory JS implementation is the right choice for a browser-based demo
3. **Storage**: localStorage (hot) + IndexedDB (cold) is appropriate for client-side persistence
4. **Server-side**: API routes proxy to Gemini API (keeps key server-side, handles rate limiting)
5. **Compliance**: Integrated into Accounting issue scanner rather than separate tab
