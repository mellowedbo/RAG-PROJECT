/* ═══════════════════════════════════════════════════════════
   NEXUS — Shared Type Definitions
   ═══════════════════════════════════════════════════════════ */

export type AppMode = 'demo' | 'test';

export interface DocInfo {
  id: string;
  title: string;
  filename: string;
  docType: string;
  sector: string | null;
  wordCount: number;
  chunkCount: number;
  status: string;
  createdAt: string;
}

export interface ChunkInfo {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  section: string | null;
  wordCount: number;
  charCount: number;
  /** Embedding vector (up to 3072-dim for Gemini Embedding 2) */
  embedding?: number[];
}

export interface AgentStep {
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration: number;
  output: string;
}

export interface CitedChunk {
  index: number;
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  section: string | null;
  score: number;
  preview: string;
}

export interface ComplianceFinding {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  reference: string;
  chunkIndex: number;
  excerpt: string;
}

export interface QueryMetrics {
  chunksSearched: number;
  chunksRetrieved: number;
  retrievalMs: number;
  synthesisMs: number;
  totalLatencyMs: number;
  confidenceScore: number;
}

export interface PipelineConfig {
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  useEmbeddings: boolean;
  simulationMode: boolean;
  embeddingModel: string;
  generationModel: string;
  /** Gemini Embedding 2 output dimensionality (128–3072) */
  embeddingDimensions: number;
  /** Task type for embedding optimization */
  embeddingTaskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY' | 'CLASSIFICATION' | 'CLUSTERING';
}

export const DEFAULT_CONFIG: PipelineConfig = {
  chunkSize: 800,
  chunkOverlap: 120,
  topK: 8,
  useEmbeddings: true,
  simulationMode: false,
  embeddingModel: 'gemini-embedding-2',
  generationModel: 'gemma-4-31b-it',
  embeddingDimensions: 768,
  embeddingTaskType: 'RETRIEVAL_DOCUMENT',
};

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: ChunkInfo;
}
