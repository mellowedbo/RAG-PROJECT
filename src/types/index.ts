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
  /** Embedding vector (768-dim for text-embedding-004) */
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
}

export const DEFAULT_CONFIG: PipelineConfig = {
  chunkSize: 800,
  chunkOverlap: 120,
  topK: 8,
  useEmbeddings: true,
  simulationMode: false,
  embeddingModel: 'text-embedding-004',
  generationModel: 'gemini-2.0-flash',
};

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: ChunkInfo;
}
