/**
 * Shared Type Definitions
 * Financial Intelligence RAG Platform
 */

export type AppMode = 'demo' | 'test';

// Document & Chunk Types

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

// RAG Pipeline Types

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

export interface QueryMetrics {
  chunksSearched: number;
  chunksRetrieved: number;
  retrievalMs: number;
  synthesisMs: number;
  totalLatencyMs: number;
  confidenceScore: number;
}

// Model Catalog

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: 'embedding' | 'generation';
  /** Tier: stable = production-ready, experimental = may not be available everywhere, open-weight = self-hostable */
  tier: 'stable' | 'experimental' | 'open-weight';
  maxTokens?: number;
  dimensions?: number;
  isMultimodal?: boolean;
  isRecommended?: boolean;
  isDeprecated?: boolean;
}

export interface ModelHealthStatus {
  modelId: string;
  available: boolean;
  latencyMs: number | null;
  error: string | null;
  testedAt: string;
}

export const EMBEDDING_MODELS: ModelOption[] = [
  {
    id: 'gemini-embedding-2',
    name: 'Gemini Embedding 2',
    description: 'Latest multimodal embeddings — 3072-dim, adjustable, task instructions, PDF/image/audio support',
    provider: 'Google',
    category: 'embedding',
    tier: 'stable',
    maxTokens: 8192,
    dimensions: 3072,
    isMultimodal: true,
    isRecommended: true,
  },
  {
    id: 'gemini-embedding-exp-03-07',
    name: 'Gemini Embedding Exp 03-07',
    description: 'Experimental embedding model — 3072-dim, latest architecture, may change without notice',
    provider: 'Google',
    category: 'embedding',
    tier: 'experimental',
    maxTokens: 8192,
    dimensions: 3072,
    isMultimodal: true,
  },
  {
    id: 'text-embedding-004',
    name: 'text-embedding-004',
    description: 'Stable text embeddings — 768-dim, text only, fast and reliable',
    provider: 'Google',
    category: 'embedding',
    tier: 'stable',
    maxTokens: 2048,
    dimensions: 768,
    isMultimodal: false,
  },
];

export const GENERATION_MODELS: ModelOption[] = [
  // ── Stable (Production-Ready) ──
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Best for most tasks — adaptive thinking, fast, widely available globally',
    provider: 'Google',
    category: 'generation',
    tier: 'stable',
    maxTokens: 65536,
    isMultimodal: true,
    isRecommended: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Most capable — deep thinking for complex financial analysis, highest quality',
    provider: 'Google',
    category: 'generation',
    tier: 'stable',
    maxTokens: 65536,
    isMultimodal: true,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Fast and versatile — excellent balance of speed and quality, widely available',
    provider: 'Google',
    category: 'generation',
    tier: 'stable',
    maxTokens: 8192,
    isMultimodal: true,
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    description: 'Lightweight and fastest — cost-effective for simple queries and high volume',
    provider: 'Google',
    category: 'generation',
    tier: 'stable',
    maxTokens: 8192,
    isMultimodal: true,
  },
  // ── Experimental (May not be available in all regions) ──
  {
    id: 'gemini-2.5-flash-preview-05-20',
    name: 'Gemini 2.5 Flash Preview',
    description: 'Preview build with latest improvements — may not be available in all regions',
    provider: 'Google',
    category: 'generation',
    tier: 'experimental',
    maxTokens: 65536,
    isMultimodal: true,
  },
  {
    id: 'gemini-2.5-pro-preview-05-06',
    name: 'Gemini 2.5 Pro Preview',
    description: 'Preview of most capable Gemini — may not be available in all regions',
    provider: 'Google',
    category: 'generation',
    tier: 'experimental',
    maxTokens: 65536,
    isMultimodal: true,
  },
  {
    id: 'gemini-2.5-flash-lite-preview-06-17',
    name: 'Gemini 2.5 Flash Lite Preview',
    description: 'Lightweight 2.5 preview — cost-efficient, good for simple tasks if available',
    provider: 'Google',
    category: 'generation',
    tier: 'experimental',
    maxTokens: 65536,
    isMultimodal: true,
  },
  {
    id: 'gemini-2.5-pro-preview-06-05',
    name: 'Gemini 2.5 Pro Preview (Jun)',
    description: 'June preview of 2.5 Pro — latest improvements, may have regional restrictions',
    provider: 'Google',
    category: 'generation',
    tier: 'experimental',
    maxTokens: 65536,
    isMultimodal: true,
  },
  // ── Open-Weight (Self-hostable — availability depends on your setup) ──
  {
    id: 'gemma-3-27b-it',
    name: 'Gemma 3 27B IT',
    description: 'Largest open Gemma 3 — 27B params, 96K context, strong reasoning. Availability varies by region.',
    provider: 'Google',
    category: 'generation',
    tier: 'open-weight',
    maxTokens: 8192,
  },
  {
    id: 'gemma-3-12b-it',
    name: 'Gemma 3 12B IT',
    description: 'Mid-size open Gemma 3 — efficient for standard queries. Availability varies by region.',
    provider: 'Google',
    category: 'generation',
    tier: 'open-weight',
    maxTokens: 8192,
  },
  {
    id: 'gemma-3-4b-it',
    name: 'Gemma 3 4B IT',
    description: 'Compact open Gemma 3 — fast inference, simple tasks. Availability varies by region.',
    provider: 'Google',
    category: 'generation',
    tier: 'open-weight',
    maxTokens: 8192,
  },
];

export const ALL_MODELS = [...EMBEDDING_MODELS, ...GENERATION_MODELS];

export const ALL_GENERATION_MODEL_IDS: string[] = GENERATION_MODELS.map(m => m.id);

// Pipeline Config

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
  generationModel: 'gemini-2.5-flash',
  embeddingDimensions: 768,
  embeddingTaskType: 'RETRIEVAL_DOCUMENT',
};

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: ChunkInfo;
}

// Compliance Types

export interface ComplianceFinding {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  reference: string;
  chunkIndex: number;
  excerpt: string;
}

// Accounting Types

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  narration?: string;
  isVerified: boolean;
  issues?: string[];
}

export interface AccountEntry {
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normalBalance: 'debit' | 'credit';
  balance: number;
}

export interface TrialBalanceEntry {
  accountName: string;
  debit: number;
  credit: number;
}

export interface AccountingIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  suggestion: string;
  relatedEntries: string[];
}

// Tax Types

export type TaxRegime = 'old' | 'new';

export interface IncomeTaxInput {
  annualIncome: number;
  regime: TaxRegime;
  age: number;
  deductions80C: number;
  deductions80D: number;
  hraExemption: number;
  otherDeductions: number;
}

export interface TaxSlab {
  range: string;
  rate: number;
  taxableFrom: number;
  taxableTo: number;
}

export interface IncomeTaxResult {
  regime: TaxRegime;
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxAmount: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
  slabs: TaxSlab[];
  comparison?: {
    oldRegimeTax: number;
    newRegimeTax: number;
    savings: number;
    betterRegime: TaxRegime;
  };
}

export interface GSTInput {
  amount: number;
  gstRate: number;
  gstType: 'cgst_sgst' | 'igst';
  isInclusive: boolean;
}

export interface GSTResult {
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  rate: number;
}

// Financial Analysis Types

export interface FinancialRatio {
  name: string;
  formula: string;
  value: number;
  unit: 'ratio' | 'percent' | 'currency';
  category: 'liquidity' | 'profitability' | 'leverage' | 'efficiency' | 'market';
  interpretation: string;
  isHealthy: boolean;
}

export interface FinancialStatement {
  id: string;
  companyName: string;
  period: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow';
  data: Record<string, number>;
}

export interface AnalysisResult {
  ratios: FinancialRatio[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

// Pipeline Stats

export interface PipelineStats {
  totalQueries: number;
  avgRetrievalMs: number;
  avgSynthesisMs: number;
  avgConfidence: number;
  documentsProcessed: number;
  chunksIndexed: number;
  embeddingsGenerated: number;
  modelsUsed: Record<string, number>;
}
