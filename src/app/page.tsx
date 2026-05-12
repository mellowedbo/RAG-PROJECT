'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import Navigation from '@/components/Navigation';
import DashboardView from '@/components/DashboardView';
import DocumentsView from '@/components/DocumentsView';
import QueryView from '@/components/QueryView';
import AccountingView from '@/components/AccountingView';
import TaxView from '@/components/TaxView';
import AnalysisView from '@/components/AnalysisView';
import ColabView from '@/components/ColabView';
import SettingsView from '@/components/SettingsView';

import { useRAGPipeline } from '@/hooks/useRAGPipeline';

/* ═══════════════════════ Constants ═══════════════════════ */

const SAMPLE_QUERIES = [
  'What are the key risk factors identified across all documents?',
  'What is the revenue growth and forward guidance for Tesla?',
  'Are there any compliance or regulatory issues at Goldman Sachs?',
  'What cybersecurity risks are disclosed across the portfolio?',
  'Identify any material weaknesses in internal controls',
  'What is the credit risk and liquidity position at JP Morgan?',
  'Summarize operational risk events and their financial impact',
  'Compare financial performance across the portfolio companies',
];

/* ═══════════════════════ Colab Notebook Code ═══════════════════════ */

const COLAB_CODE = `# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  NEXUS — Agentic RAG for Financial Intelligence | Google Colab Notebook ║
# ║  4-Agent Pipeline: Ingestion → Retrieval → Reasoning → Synthesis       ║
# ║  Powered by Gemma 4 31B IT + Gemini Embedding 2 (Free Tier)            ║
# ╚══════════════════════════════════════════════════════════════════════════╝
#
# Paste this entire file into a single Colab cell, or split at the
# "# ═══ CELL BREAK ═══" markers for multi-cell usage.
# Get a free Gemini API key at: https://aistudio.google.com/apikey
# ════════════════════════════════════════════════════════════════════════════

# ═══ CELL 1: Install Dependencies ═════════════════════════════════════════

!pip install -q google-generativeai pandas matplotlib numpy

import os, sys, json, re, math, time, textwrap
from datetime import datetime
from collections import Counter

import google.generativeai as genai
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# ═══ CELL 2: Configure Gemini API ═════════════════════════════════════════

GEMINI_KEY = None
try:
    from google.colab import userdata
    GEMINI_KEY = userdata.get('GOOGLE_API_KEY')
except:
    pass

if not GEMINI_KEY:
    GEMINI_KEY = input("  Enter your Gemini API key: ").strip()

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
    gen_model = genai.GenerativeModel('gemma-4-31b-it')
    EMBEDDING_MODEL = 'gemini-embedding-2'
    EMBEDDING_DIM = 768
    print("✓ Gemini API configured")
    print(f"  Generation: Gemma 4 31B IT")
    print(f"  Embeddings: Gemini Embedding 2 ({EMBEDDING_DIM}-dim)")
else:
    gen_model = None
    EMBEDDING_MODEL = None
    print("⚠ No API key — retrieval-only mode")

print("\\nNEXUS RAG Pipeline Ready.")

# ═══ CELL 3: Document Ingestion & Chunking ════════════════════════════════

SAMPLE_DOCS = {
    "Tesla 10-K 2024": """
ITEM 1. BUSINESS
Tesla, Inc. was incorporated in the State of Delaware on July 1, 2003. We design, develop,
manufacture and sell high-performance fully electric vehicles and energy generation and storage
systems. Revenue for the year ended December 31, 2024 was $96.8 billion, an increase of 18%.

ITEM 1A. RISK FACTORS
We may be subject to legal proceedings and governmental investigations that may adversely affect
our business. We have identified a material weakness in our internal control over financial reporting.

ITEM 7. MD&A
Total automotive revenues increased $10.2 billion, or 15%, in 2024. We delivered approximately
1.81 million vehicles in 2024, an increase of 7% from 2023. Gross margin decreased from 18.2%
to 17.1%.
    """,
    "Goldman Sachs Q4 2024": """
Q4 2024 EARNINGS
Net revenues for Q4 2024 were $13.9 billion, 23% higher than Q4 2023. Net earnings were
$4.1 billion, an increase of 105%. Full year 2024 revenues were $53.2 billion.

RISK FACTORS
We are subject to credit risk, regulatory investigations by the SEC, and anti-corruption laws
including the FCPA. We experienced a data breach affecting 12,000 client accounts.
    """,
}

def chunk_text(text, max_chunk=800, overlap=120, min_chunk=80):
    paragraphs = text.split("\\n\\n")
    chunks = []
    current = ""
    section = None

    section_re = re.compile(
        r"^(?:ITEM\\s+\\d+[A-Z]?\\.?|PART\\s+[IVX]+|RISK\\s+FACTORS|MD&A|"
        r"MANAGEMENT.S\\s+DISCUSSION|EXECUTIVE\\s+SUMMARY|CREDIT\\s+RISK|"
        r"MARKET\\s+RISK|OPERATIONAL\\s+RISK|REGULATORY|COMPLIANCE|"
        r"FINANCIAL\\s+HIGHLIGHTS|CLIMATE|ESG)", re.I
    )

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        sec_match = section_re.match(para)
        if sec_match:
            if len(current.strip()) >= min_chunk:
                chunks.append({"content": current.strip(), "section": section})
            current = current[-overlap:] + "\\n\\n" + para if current.strip() else para
            section = sec_match.group(0).upper()
        elif len(current) + len(para) > max_chunk and len(current.strip()) >= min_chunk:
            chunks.append({"content": current.strip(), "section": section})
            current = current[-overlap:] + "\\n\\n" + para
        else:
            current = current + "\\n\\n" + para if current else para

    if current.strip():
        chunks.append({"content": current.strip(), "section": section})

    for i, c in enumerate(chunks):
        c["index"] = i
        c["word_count"] = len(c["content"].split())

    return chunks

all_chunks = []
for doc_name, doc_text in SAMPLE_DOCS.items():
    doc_chunks = chunk_text(doc_text)
    for c in doc_chunks:
        c["document"] = doc_name
    all_chunks.extend(doc_chunks)

print(f"✓ Indexed {len(all_chunks)} chunks from {len(SAMPLE_DOCS)} documents")

# ═══ CELL 4: Gemini Embedding 2 — Vector Index ═══════════════════════════

import requests as requests_lib

def get_embeddings(texts, task_type="RETRIEVAL_DOCUMENT"):
    if not GEMINI_KEY:
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{EMBEDDING_MODEL}:batchEmbedContents?key={GEMINI_KEY}"
    requests_list = []
    for text in texts:
        req = {
            "model": f"models/{EMBEDDING_MODEL}",
            "content": {"parts": [{"text": text}]},
            "taskType": task_type,
        }
        if EMBEDDING_DIM < 3072:
            req["outputDimensionality"] = EMBEDDING_DIM
        requests_list.append(req)
    response = requests_lib.post(url, json={"requests": requests_list})
    data = response.json()
    if "embeddings" in data:
        return [e["values"] for e in data["embeddings"]]
    else:
        print(f"⚠ Embedding error: {data.get('error', {}).get('message', 'unknown')}")
        return None

print(f"\\nGenerating embeddings with Gemini Embedding 2 ({EMBEDDING_DIM}-dim)...")
chunk_texts = [c["content"] for c in all_chunks]
embeddings = get_embeddings(chunk_texts, "RETRIEVAL_DOCUMENT")

if embeddings:
    for i, emb in enumerate(embeddings):
        all_chunks[i]["embedding"] = np.array(emb)
    print(f"✓ Embedded {len(embeddings)} chunks ({EMBEDDING_DIM} dimensions each)")
else:
    print("⚠ Using TF-IDF fallback (no embeddings)")

# ═══ CELL 5: Retrieval — Cosine Similarity + TF-IDF Hybrid ═════════════

def cosine_sim(a, b):
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    return dot / norm if norm > 0 else 0

def retrieve(query, top_k=5):
    if embeddings and GEMINI_KEY:
        query_embs = get_embeddings([query], "RETRIEVAL_QUERY")
        if query_embs:
            query_vec = np.array(query_embs[0])
            scores = [(cosine_sim(query_vec, c["embedding"]), c) for c in all_chunks]
            scores.sort(key=lambda x: x[0], reverse=True)
            return [(s, c) for s, c in scores[:top_k]]
    from sklearn.feature_extraction.text import TfidfVectorizer
    corpus = [c["content"] for c in all_chunks] + [query]
    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    tfidf_matrix = vectorizer.fit_transform(corpus)
    query_vec = tfidf_matrix[-1]
    doc_vecs = tfidf_matrix[:-1]
    similarities = (doc_vecs @ query_vec.T).toarray().flatten()
    top_indices = similarities.argsort()[-top_k:][::-1]
    return [(similarities[i], all_chunks[i]) for i in top_indices]

# ═══ CELL 6: RAG Query Pipeline ══════════════════════════════════════════

def rag_query(query, top_k=5):
    print(f"\\n{'='*60}")
    print(f"QUERY: {query}")
    print(f"{'='*60}")
    t0 = time.time()
    results = retrieve(query, top_k)
    retrieval_ms = (time.time() - t0) * 1000
    print(f"\\n[Retrieval Agent] Found {len(results)} chunks in {retrieval_ms:.0f}ms")
    context = "\\n\\n---\\n\\n".join([
        f"[Source {i+1} | {c['document']} | {c['section'] or 'General'} | Score: {s:.3f}]\\n{c['content']}"
        for i, (s, c) in enumerate(results)
    ])
    if not gen_model:
        print("\\n⚠ No API key — retrieval-only mode")
        for i, (s, c) in enumerate(results):
            print(f"\\nSource {i+1} (score: {s:.3f}): {c['content'][:200]}...")
        return None
    t1 = time.time()
    prompt = f"""You are NEXUS, a financial intelligence analyst powered by Gemma 4 31B.
Analyze the following financial document excerpts and answer the query.

RULES:
1. ONLY use information from the provided sources. Never fabricate data.
2. Always cite sources using [Source N] notation.
3. Structure with: Key Findings, Evidence, Risk Assessment, Limitations.
4. Use precise financial terminology and be quantitative.

QUERY: {query}

DOCUMENT EXCERPTS:
{context}

Provide a thorough, citation-grounded analysis."""
    response = gen_model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=1.0, top_p=0.95, top_k=64, max_output_tokens=4096,
        )
    )
    synthesis_ms = (time.time() - t1) * 1000
    total_ms = (time.time() - t0) * 1000
    print(f"[Reasoning Agent] Gemma 4 31B synthesis in {synthesis_ms:.0f}ms")
    print(f"[Synthesis Agent] Total pipeline: {total_ms:.0f}ms")
    print(f"\\n{'='*60}")
    print(response.text)
    print(f"{'='*60}")
    return response.text

# ═══ CELL 7: Run Sample Queries ══════════════════════════════════════════

queries = [
    "What are the key risk factors across all documents?",
    "What is the revenue growth for Tesla?",
    "Are there compliance issues at Goldman Sachs?",
]

for q in queries:
    rag_query(q)
    print("\\n")

# ═══ CELL 8: Interactive Query ═══════════════════════════════════════════

print("\\n" + "="*60)
print("NEXUS RAG Pipeline — Interactive Mode")
print("Type your query or 'quit' to exit")
print("="*60)

while True:
    query = input("\\n🔍 Query: ").strip()
    if query.lower() in ('quit', 'exit', 'q'):
        break
    if query:
        rag_query(query)
`;

/* ═══════════════════════ Main Page ═══════════════════════ */

export default function NexusPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const pipeline = useRAGPipeline();
  const {
    mode: appMode,
    documents,
    chunks,
    apiKey,
    config,
    queryResult,
    citedChunks,
    metrics,
    agentSteps,
    isProcessing,
    setIsProcessing,
    embeddingProgress,
    error,
    setMode: handleModeChange,
    setApiKey,
    setConfig,
    uploadDocument,
    pasteDocument,
    deleteDocument,
    runQuery,
  } = pipeline;

  const [queryCount, setQueryCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleRunQuery = async (query: string) => {
    await runQuery(query);
    setQueryCount(c => c + 1);
  };

  const handleUploadText = async (title: string, content: string, docType: string, sector: string) => {
    setUploadError(null);
    setUploadSuccess(false);
    try {
      await pasteDocument(title, content, docType, sector || null);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    }
  };

  const handleUploadFile = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);
    try {
      await uploadDocument(file);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'File upload failed');
    }
  };

  const handleDeleteDocument = (id: string) => {
    deleteDocument(id);
  };

  const handleRefresh = () => {
    handleModeChange(appMode);
  };

  /* ═══════════════════════ Tab Content ═══════════════════════ */

  const tabContent: Record<string, React.ReactNode> = {
    dashboard: (
      <DashboardView
        documents={documents}
        chunks={chunks}
        queryCount={queryCount}
        appMode={appMode}
        config={config}
        apiKey={apiKey}
        onTabChange={setActiveTab}
      />
    ),
    documents: (
      <DocumentsView
        documents={documents}
        chunks={chunks}
        appMode={appMode}
        onUploadFile={handleUploadFile}
        onUploadText={handleUploadText}
        onDelete={handleDeleteDocument}
        onRefresh={handleRefresh}
        isUploading={isProcessing}
        uploadError={uploadError || error}
        uploadSuccess={uploadSuccess}
      />
    ),
    query: (
      <QueryView
        chunks={chunks}
        apiKey={apiKey}
        isAnalyzing={isProcessing}
        agentSteps={agentSteps}
        result={queryResult || null}
        metrics={metrics}
        citedChunks={citedChunks}
        error={error}
        onRunQuery={handleRunQuery}
        sampleQueries={SAMPLE_QUERIES}
      />
    ),
    accounting: (
      <AccountingView
        apiKey={apiKey}
        generationModel={config.generationModel}
        simulationMode={config.simulationMode}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
      />
    ),
    tax: (
      <TaxView
        apiKey={apiKey}
        generationModel={config.generationModel}
        simulationMode={config.simulationMode}
        chunks={chunks}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
      />
    ),
    analysis: (
      <AnalysisView
        apiKey={apiKey}
        generationModel={config.generationModel}
        simulationMode={config.simulationMode}
        chunks={chunks}
        documents={documents}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
      />
    ),
    colab: <ColabView colabCode={COLAB_CODE} />,
    settings: (
      <SettingsView
        apiKey={apiKey}
        setApiKey={setApiKey}
        simulationMode={config.simulationMode}
        setSimulationMode={(v) => setConfig({ simulationMode: v })}
        useEmbeddings={config.useEmbeddings}
        setUseEmbeddings={(v) => setConfig({ useEmbeddings: v })}
        config={config}
        onConfigChange={setConfig}
        embeddingProgress={embeddingProgress ? (embeddingProgress.done / embeddingProgress.total) * 100 : null}
      />
    ),
  };

  /* ═══════════════════════ Render ═══════════════════════ */

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        appMode={appMode}
        onModeChange={handleModeChange}
        apiKey={apiKey}
        setApiKey={setApiKey}
      />

      <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {tabContent[activeTab] || tabContent.dashboard}
        </motion.div>
      </main>

      <footer className="mt-auto border-t border-border bg-muted/30 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold">NEXUS</span>
            <span>•</span>
            <span>Financial Intelligence Platform</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {config.simulationMode ? 'Simulation Mode' : 'Live Mode'} • {config.embeddingModel} ({config.embeddingDimensions || 768}-dim) • {config.generationModel}
          </div>
        </div>
      </footer>
    </div>
  );
}
