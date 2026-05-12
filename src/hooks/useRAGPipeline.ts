/* ═══════════════════════════════════════════════════════════
   NEXUS — RAG Pipeline Orchestration Hook
   Core state management + full chunk→embed→store→retrieve→generate pipeline
   ═══════════════════════════════════════════════════════════ */

import { useState, useCallback, useRef } from 'react';
import type {
  AppMode,
  DocInfo,
  ChunkInfo,
  AgentStep,
  CitedChunk,
  ComplianceFinding,
  QueryMetrics,
  PipelineConfig,
} from '@/types';
import { DEFAULT_CONFIG } from '@/types';
import { DEMO_DOCUMENTS, DEMO_CHUNKS } from '@/lib/demoData';
import { chunkTextRecursive } from '@/lib/chunker';
import { scoreChunksByTFIDF, retrieveByEmbedding } from '@/lib/retriever';
import { scanForCompliance } from '@/lib/compliance';
import { embedChunks, getQueryEmbedding, getMockEmbeddings } from '@/lib/embeddings';
import { MemoryVectorDB } from '@/lib/vectordb';
import {
  saveDocsToHot,
  loadDocsFromHot,
  saveChunksToHot,
  loadChunksFromHot,
  saveApiKeyToHot,
  loadApiKeyFromHot,
  saveConfigToHot,
  loadConfigFromHot,
} from '@/lib/storage';

/* ─── Agent step definitions ──────────────────────────────── */

const AGENT_STEP_DEFS: { agent: string; label: string }[] = [
  { agent: 'Retrieval', label: 'Retrieving relevant chunks' },
  { agent: 'Ranking', label: 'Ranking by relevance score' },
  { agent: 'Reasoning', label: 'Analyzing and cross-referencing' },
  { agent: 'Synthesis', label: 'Generating final response' },
];

function makeInitialSteps(): AgentStep[] {
  return AGENT_STEP_DEFS.map(({ agent }) => ({
    agent,
    status: 'pending' as const,
    duration: 0,
    output: '',
  }));
}

/* ─── Unique ID helper ────────────────────────────────────── */

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ─── Document type detection ─────────────────────────────── */

function detectDocType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('10-k') || lower.includes('10k')) return '10k';
  if (lower.includes('10-q') || lower.includes('10q')) return '10q';
  if (lower.includes('8-k') || lower.includes('8k')) return '8k';
  if (lower.includes('earnings') || lower.includes('quarterly')) return 'earnings';
  if (lower.includes('risk')) return 'risk_assessment';
  if (lower.includes('prospectus')) return 'prospectus';
  if (lower.includes('esg') || lower.includes('sustainability')) return 'esg';
  return 'financial_report';
}

function detectSector(filename: string): string | null {
  const lower = filename.toLowerCase();
  if (lower.includes('bank') || lower.includes('morgan') || lower.includes('goldman') || lower.includes('sachs'))
    return 'Financial Services';
  if (lower.includes('tesla') || lower.includes('automotive') || lower.includes('motors'))
    return 'Automotive & Technology';
  if (lower.includes('pharma') || lower.includes('health') || lower.includes('bio'))
    return 'Healthcare & Pharma';
  if (lower.includes('energy') || lower.includes('oil') || lower.includes('petro'))
    return 'Energy & Utilities';
  return null;
}

/* ═══════════════════════════════════════════════════════════
   Hook: useRAGPipeline
   ═══════════════════════════════════════════════════════════ */

export function useRAGPipeline() {
  /* ─── Core State ─────────────────────────────────────────── */
  const [mode, setModeState] = useState<AppMode>('demo');
  const [documents, setDocuments] = useState<DocInfo[]>(DEMO_DOCUMENTS);
  const [chunks, setChunks] = useState<ChunkInfo[]>(DEMO_CHUNKS);
  const [apiKey, setApiKeyState] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return loadApiKeyFromHot();
  });
  const [config, setConfigState] = useState<PipelineConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    const saved = loadConfigFromHot();
    if (saved) {
      return { ...DEFAULT_CONFIG, ...saved };
    }
    return DEFAULT_CONFIG;
  });

  /* ─── Query State ────────────────────────────────────────── */
  const [queryResult, setQueryResult] = useState<string>('');
  const [citedChunks, setCitedChunks] = useState<CitedChunk[]>([]);
  const [metrics, setMetrics] = useState<QueryMetrics | null>(null);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>(makeInitialSteps());

  /* ─── Compliance State ───────────────────────────────────── */
  const [complianceFindings, setComplianceFindings] = useState<ComplianceFinding[]>([]);

  /* ─── Processing State ───────────────────────────────────── */
  const [isProcessing, setIsProcessing] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ─── Refs ───────────────────────────────────────────────── */
  const vectorDBRef = useRef<MemoryVectorDB>(new MemoryVectorDB());

  /* ═══════════════════════════════════════════════════════════
     Mode Switching
     ═══════════════════════════════════════════════════════════ */

  const setMode = useCallback(
    (newMode: AppMode) => {
      setModeState(newMode);

      if (newMode === 'demo') {
        // Load pre-built demo data and pre-seed the vector DB
        setDocuments(DEMO_DOCUMENTS);
        setChunks(DEMO_CHUNKS);
        setError(null);
        clearQueryState();

        // Seed the vector DB with demo chunk embeddings
        const db = new MemoryVectorDB();
        const mockEmbeddings = getMockEmbeddings(DEMO_CHUNKS.map((c) => c.content));
        const entries = DEMO_CHUNKS.map((chunk, i) => ({
          id: chunk.id,
          vector: mockEmbeddings[i],
          metadata: { ...chunk, embedding: mockEmbeddings[i] },
        }));
        db.addVectors(entries);
        vectorDBRef.current = db;
      } else {
        // Test mode: load from localStorage
        const savedDocs = loadDocsFromHot();
        const savedChunks = loadChunksFromHot();
        setDocuments(savedDocs);
        setChunks(savedChunks);
        setError(null);
        clearQueryState();

        // Rebuild vector DB from saved chunks with embeddings
        const db = new MemoryVectorDB();
        const chunksWithEmbeddings = savedChunks.filter(
          (c) => c.embedding && c.embedding.length > 0
        );
        if (chunksWithEmbeddings.length > 0) {
          const entries = chunksWithEmbeddings.map((chunk) => ({
            id: chunk.id,
            vector: chunk.embedding!,
            metadata: chunk,
          }));
          db.addVectors(entries);
        }
        vectorDBRef.current = db;
      }
    },
    []
  );

  /* ═══════════════════════════════════════════════════════════
     API Key
     ═══════════════════════════════════════════════════════════ */

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    saveApiKeyToHot(key);
  }, []);

  /* ═══════════════════════════════════════════════════════════
     Config
     ═══════════════════════════════════════════════════════════ */

  const setConfig = useCallback((update: Partial<PipelineConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...update };
      saveConfigToHot(next as Record<string, unknown>);
      return next;
    });
  }, []);

  /* ═══════════════════════════════════════════════════════════
     Internal Helpers
     ═══════════════════════════════════════════════════════════ */

  const clearQueryState = useCallback(() => {
    setQueryResult('');
    setCitedChunks([]);
    setMetrics(null);
    setAgentSteps(makeInitialSteps());
  }, []);

  /** Persist documents + chunks to localStorage (test mode only) */
  const persistToStorage = useCallback(() => {
    if (mode === 'test') {
      saveDocsToHot(documents);
      saveChunksToHot(chunks);
    }
  }, [mode, documents, chunks]);

  /** Rebuild vector DB from current chunks that have embeddings */
  const rebuildVectorDB = useCallback((currentChunks: ChunkInfo[]) => {
    const db = new MemoryVectorDB();
    const withEmbeddings = currentChunks.filter(
      (c) => c.embedding && c.embedding.length > 0
    );
    if (withEmbeddings.length > 0) {
      const entries = withEmbeddings.map((chunk) => ({
        id: chunk.id,
        vector: chunk.embedding!,
        metadata: chunk,
      }));
      db.addVectors(entries);
    }
    vectorDBRef.current = db;
  }, []);

  /* ═══════════════════════════════════════════════════════════
     Document Upload (File)
     ═══════════════════════════════════════════════════════════ */

  const uploadDocument = useCallback(
    async (file: File) => {
      setError(null);
      setIsProcessing(true);
      setEmbeddingProgress(null);

      try {
        // 1. Extract text via /api/extract
        const formData = new FormData();
        formData.append('file', file);

        const extractRes = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
        });

        if (!extractRes.ok) {
          const errData = await extractRes.json().catch(() => ({}));
          throw new Error(
            (errData as Record<string, string>).error ||
              `File extraction failed (${extractRes.status})`
          );
        }

        const { text, filename } = (await extractRes.json()) as {
          text: string;
          filename: string;
          chars: number;
          words: number;
        };

        // 2. Build DocInfo
        const docId = `doc-${uid()}`;
        const docInfo: DocInfo = {
          id: docId,
          title: filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
          filename,
          docType: detectDocType(filename),
          sector: detectSector(filename),
          wordCount: text.split(/\s+/).filter((w) => w.length > 0).length,
          chunkCount: 0, // will update after chunking
          status: 'uploading',
          createdAt: new Date().toISOString(),
        };

        // 3. Chunk
        const rawChunks = chunkTextRecursive(text, {
          chunkSize: config.chunkSize,
          overlap: config.chunkOverlap,
        });

        const newChunks: ChunkInfo[] = rawChunks.map((rc, i) => ({
          id: `chunk-${uid()}`,
          documentId: docId,
          content: rc.content,
          chunkIndex: i,
          section: rc.section,
          wordCount: rc.wordCount,
          charCount: rc.charCount,
        }));

        docInfo.chunkCount = newChunks.length;
        docInfo.status = 'chunked';

        // 4. Embed chunks
        docInfo.status = 'embedding';
        setDocuments((prev) => [...prev, docInfo]);

        const embeddingMap = await embedChunks(
          newChunks.map((c) => ({ id: c.id, content: c.content })),
          apiKey,
          config.simulationMode || !apiKey,
          (done, total) => setEmbeddingProgress({ done, total })
        );

        // Attach embeddings to chunks
        const embeddedChunks: ChunkInfo[] = newChunks.map((chunk) => ({
          ...chunk,
          embedding: embeddingMap.get(chunk.id),
        }));

        // 5. Update vector DB
        const db = vectorDBRef.current;
        const entries = embeddedChunks
          .filter((c) => c.embedding && c.embedding.length > 0)
          .map((chunk) => ({
            id: chunk.id,
            vector: chunk.embedding!,
            metadata: chunk,
          }));
        db.addVectors(entries);

        // 6. Finalize state
        docInfo.status = 'ready';
        setChunks((prev) => [...prev, ...embeddedChunks]);
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, status: 'ready' } : d))
        );
        setEmbeddingProgress(null);

        // Persist in test mode
        if (mode === 'test') {
          saveDocsToHot([...documents, docInfo]);
          saveChunksToHot([...chunks, ...embeddedChunks]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Document upload failed';
        setError(message);
      } finally {
        setIsProcessing(false);
        setEmbeddingProgress(null);
      }
    },
    [apiKey, config.chunkSize, config.chunkOverlap, config.simulationMode, mode, documents, chunks]
  );

  /* ═══════════════════════════════════════════════════════════
     Document Paste (Text)
     ═══════════════════════════════════════════════════════════ */

  const pasteDocument = useCallback(
    async (
      title: string,
      text: string,
      docType: string = 'financial_report',
      sector: string | null = null
    ) => {
      setError(null);
      setIsProcessing(true);
      setEmbeddingProgress(null);

      try {
        const docId = `doc-${uid()}`;
        const docInfo: DocInfo = {
          id: docId,
          title,
          filename: `${title.replace(/\s+/g, '_')}.txt`,
          docType,
          sector,
          wordCount: text.split(/\s+/).filter((w) => w.length > 0).length,
          chunkCount: 0,
          status: 'uploading',
          createdAt: new Date().toISOString(),
        };

        // Chunk
        const rawChunks = chunkTextRecursive(text, {
          chunkSize: config.chunkSize,
          overlap: config.chunkOverlap,
        });

        const newChunks: ChunkInfo[] = rawChunks.map((rc, i) => ({
          id: `chunk-${uid()}`,
          documentId: docId,
          content: rc.content,
          chunkIndex: i,
          section: rc.section,
          wordCount: rc.wordCount,
          charCount: rc.charCount,
        }));

        docInfo.chunkCount = newChunks.length;
        docInfo.status = 'chunked';

        // Embed
        docInfo.status = 'embedding';
        setDocuments((prev) => [...prev, docInfo]);

        const embeddingMap = await embedChunks(
          newChunks.map((c) => ({ id: c.id, content: c.content })),
          apiKey,
          config.simulationMode || !apiKey,
          (done, total) => setEmbeddingProgress({ done, total })
        );

        const embeddedChunks: ChunkInfo[] = newChunks.map((chunk) => ({
          ...chunk,
          embedding: embeddingMap.get(chunk.id),
        }));

        // Update vector DB
        const db = vectorDBRef.current;
        const entries = embeddedChunks
          .filter((c) => c.embedding && c.embedding.length > 0)
          .map((chunk) => ({
            id: chunk.id,
            vector: chunk.embedding!,
            metadata: chunk,
          }));
        db.addVectors(entries);

        // Finalize
        docInfo.status = 'ready';
        setChunks((prev) => [...prev, ...embeddedChunks]);
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, status: 'ready' } : d))
        );
        setEmbeddingProgress(null);

        if (mode === 'test') {
          saveDocsToHot([...documents, docInfo]);
          saveChunksToHot([...chunks, ...embeddedChunks]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Document paste failed';
        setError(message);
      } finally {
        setIsProcessing(false);
        setEmbeddingProgress(null);
      }
    },
    [apiKey, config.chunkSize, config.chunkOverlap, config.simulationMode, mode, documents, chunks]
  );

  /* ═══════════════════════════════════════════════════════════
     Document Deletion
     ═══════════════════════════════════════════════════════════ */

  const deleteDocument = useCallback(
    (docId: string) => {
      // Remove from vector DB
      vectorDBRef.current.deleteByDocumentId(docId);

      // Remove from state
      const updatedDocs = documents.filter((d) => d.id !== docId);
      const updatedChunks = chunks.filter((c) => c.documentId !== docId);

      setDocuments(updatedDocs);
      setChunks(updatedChunks);

      // Persist if test mode
      if (mode === 'test') {
        saveDocsToHot(updatedDocs);
        saveChunksToHot(updatedChunks);
      }

      // Clear query state if needed
      clearQueryState();
    },
    [documents, chunks, mode, clearQueryState]
  );

  /* ═══════════════════════════════════════════════════════════
     Full RAG Query Pipeline
     ═══════════════════════════════════════════════════════════ */

  const runQuery = useCallback(
    async (query: string) => {
      if (!query.trim() || chunks.length === 0) return;

      setError(null);
      setIsProcessing(true);
      clearQueryState();

      const pipelineStart = performance.now();
      const steps = makeInitialSteps();

      const updateStep = (
        index: number,
        update: Partial<AgentStep>
      ) => {
        steps[index] = { ...steps[index], ...update };
        setAgentSteps([...steps]);
      };

      try {
        /* ─── Step 0: Retrieval ──────────────────────────── */
        const retrievalStart = performance.now();
        updateStep(0, { status: 'running', output: 'Searching document chunks...' });

        let retrievedChunks: (ChunkInfo & { score: number })[];
        const useEmbeddingRetrieval =
          config.useEmbeddings && (apiKey || config.simulationMode) && vectorDBRef.current.size > 0;

        if (useEmbeddingRetrieval) {
          // Embed query → cosine similarity search via vectorDB
          let queryEmbedding: number[];

          if (config.simulationMode || !apiKey) {
            const mockVecs = getMockEmbeddings([query]);
            queryEmbedding = mockVecs[0];
          } else {
            queryEmbedding = await getQueryEmbedding(query, apiKey);
          }

          // Try vector DB first, fall back to brute-force on chunks
          if (vectorDBRef.current.size > 0) {
            const results = vectorDBRef.current.search(queryEmbedding, config.topK);
            retrievedChunks = results.map((r) => ({
              ...r.metadata,
              score: r.score,
            }));
          } else {
            retrievedChunks = retrieveByEmbedding(queryEmbedding, chunks, config.topK);
          }
        } else {
          // TF-IDF fallback
          retrievedChunks = scoreChunksByTFIDF(query, chunks, config.topK);
        }

        const retrievalMs = performance.now() - retrievalStart;
        updateStep(0, {
          status: 'completed',
          duration: Math.round(retrievalMs),
          output: `Retrieved ${retrievedChunks.length} chunks from ${chunks.length} total`,
        });

        /* ─── Step 1: Ranking ────────────────────────────── */
        const rankingStart = performance.now();
        updateStep(1, { status: 'running', output: 'Scoring and ranking...' });

        // Sort by score descending (already sorted, but ensure)
        retrievedChunks.sort((a, b) => b.score - a.score);

        // Build cited chunks
        const cited: CitedChunk[] = retrievedChunks.map((chunk, i) => ({
          index: i,
          chunkId: chunk.id,
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
          section: chunk.section,
          score: chunk.score,
          preview:
            chunk.content.length > 200
              ? chunk.content.slice(0, 200) + '...'
              : chunk.content,
        }));

        const rankingMs = performance.now() - rankingStart;
        updateStep(1, {
          status: 'completed',
          duration: Math.round(rankingMs),
          output: `Top ${cited.length} chunks ranked (scores: ${cited[0]?.score.toFixed(3)} – ${cited[cited.length - 1]?.score.toFixed(3)})`,
        });

        setCitedChunks(cited);

        /* ─── Step 2: Reasoning ──────────────────────────── */
        const reasoningStart = performance.now();
        updateStep(2, { status: 'running', output: 'Analyzing retrieved context...' });

        // Build context from top chunks
        const context = retrievedChunks
          .map(
            (c, i) =>
              `[Source ${i + 1}${c.section ? ` — ${c.section}` : ''}]\n${c.content}`
          )
          .join('\n\n---\n\n');

        const reasoningMs = performance.now() - reasoningStart;
        updateStep(2, {
          status: 'completed',
          duration: Math.round(reasoningMs),
          output: `Context assembled from ${retrievedChunks.length} sources`,
        });

        /* ─── Step 3: Synthesis ─────────────────────────── */
        const synthesisStart = performance.now();
        updateStep(3, { status: 'running', output: 'Generating response...' });

        let finalResponse: string;
        let synthesisMs: number;

        if (apiKey && !config.simulationMode) {
          // Call /api/gemini for LLM synthesis
          const systemPrompt = `You are NEXUS, an expert financial document analysis AI. Answer the user's question based ONLY on the provided context. Cite sources using [Source N] notation. If the context doesn't contain enough information, say so clearly. Focus on accuracy and cite specific numbers, risk factors, and findings from the documents.

Context:
${context}`;

          try {
            const res = await fetch('/api/gemini', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                apiKey,
                systemPrompt,
                userPrompt: query,
                model: config.generationModel,
              }),
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(
                (errData as Record<string, string>).error ||
                  `LLM synthesis failed (${res.status})`
              );
            }

            const data = (await res.json()) as { response: string };
            finalResponse = data.response;
          } catch (llmErr) {
            // Fall back to retrieval-only on LLM failure
            finalResponse = buildRetrievalOnlyResponse(query, cited);
            updateStep(3, {
              status: 'completed',
              duration: Math.round(performance.now() - synthesisStart),
              output: `LLM failed — showing retrieval-only results (${llmErr instanceof Error ? llmErr.message : 'unknown error'})`,
            });
            synthesisMs = performance.now() - synthesisStart;
            setQueryResult(finalResponse);
            setMetrics({
              chunksSearched: chunks.length,
              chunksRetrieved: retrievedChunks.length,
              retrievalMs: Math.round(retrievalMs),
              synthesisMs: Math.round(synthesisMs),
              totalLatencyMs: Math.round(performance.now() - pipelineStart),
              confidenceScore: computeConfidence(retrievedChunks),
            });
            setIsProcessing(false);
            return;
          }
        } else {
          // No API key or simulation mode — retrieval-only results
          finalResponse = buildRetrievalOnlyResponse(query, cited);
        }

        synthesisMs = performance.now() - synthesisStart;
        updateStep(3, {
          status: 'completed',
          duration: Math.round(synthesisMs),
          output: apiKey
            ? 'LLM synthesis complete'
            : 'Retrieval-only results (no API key)',
        });

        setQueryResult(finalResponse);
        setMetrics({
          chunksSearched: chunks.length,
          chunksRetrieved: retrievedChunks.length,
          retrievalMs: Math.round(retrievalMs),
          synthesisMs: Math.round(synthesisMs),
          totalLatencyMs: Math.round(performance.now() - pipelineStart),
          confidenceScore: computeConfidence(retrievedChunks),
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Query pipeline failed';
        setError(message);

        // Mark any running steps as failed
        for (let i = 0; i < steps.length; i++) {
          if (steps[i].status === 'running') {
            updateStep(i, { status: 'failed', output: message });
          }
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [chunks, config, apiKey, clearQueryState]
  );

  /* ═══════════════════════════════════════════════════════════
     Compliance Scanning
     ═══════════════════════════════════════════════════════════ */

  const runComplianceScan = useCallback(() => {
    if (chunks.length === 0) return;
    const findings = scanForCompliance(chunks);
    setComplianceFindings(findings);
  }, [chunks]);

  /* ═══════════════════════════════════════════════════════════
     Clear Query
     ═══════════════════════════════════════════════════════════ */

  const clearQuery = useCallback(() => {
    clearQueryState();
    setError(null);
  }, [clearQueryState]);

  /* ═══════════════════════════════════════════════════════════
     Return Hook Interface
     ═══════════════════════════════════════════════════════════ */

  return {
    // State
    mode,
    documents,
    chunks,
    apiKey,
    config,
    queryResult,
    citedChunks,
    metrics,
    agentSteps,
    complianceFindings,
    isProcessing,
    embeddingProgress,
    error,

    // Actions
    setMode,
    setApiKey,
    setConfig,
    uploadDocument,
    pasteDocument,
    deleteDocument,
    runQuery,
    runComplianceScan,
    clearQuery,
  };
}

/* ═══════════════════════════════════════════════════════════
   Helper: Build retrieval-only response
   ═══════════════════════════════════════════════════════════ */

function buildRetrievalOnlyResponse(
  query: string,
  cited: CitedChunk[]
): string {
  if (cited.length === 0) {
    return `No relevant chunks found for: "${query}"`;
  }

  const sections = cited
    .map(
      (c, i) =>
        `**Source ${i + 1}**${c.section ? ` — ${c.section}` : ''} (score: ${c.score.toFixed(3)})\n${c.preview}`
    )
    .join('\n\n---\n\n');

  return `## Retrieval Results for: "${query}"\n\n${sections}\n\n---\n*Add a Gemini API key to enable AI-powered synthesis with cross-referencing and analysis.*`;
}

/* ═══════════════════════════════════════════════════════════
   Helper: Compute confidence score
   ═══════════════════════════════════════════════════════════ */

function computeConfidence(
  retrieved: (ChunkInfo & { score: number })[]
): number {
  if (retrieved.length === 0) return 0;
  const avgScore = retrieved.reduce((s, c) => s + c.score, 0) / retrieved.length;
  // Normalize: for cosine similarity, scores are 0-1; for TF-IDF they vary
  // Clamp to 0-1 range
  return Math.min(1, Math.max(0, avgScore));
}
