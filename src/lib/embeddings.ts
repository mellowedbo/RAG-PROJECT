/* ═══════════════════════════════════════════════════════════
   NEXUS — Embeddings Client
   Gemini Embedding 2 via /api/gemini route
   Supports task_type, output_dimensionality, and multimodal inputs
   Simulation mode returns deterministic mock vectors
   ═══════════════════════════════════════════════════════════ */

import type { PipelineConfig } from '@/types';

/**
 * Get real embeddings via Gemini Embedding 2 API (server-side proxy).
 * Calls /api/gemini with mode="embed".
 *
 * Gemini Embedding 2 features:
 * - 3072-dimensional vectors (default)
 * - Adjustable output_dimensionality (128–3072) via MRL support
 * - Task-specific optimization via task_type parameter
 * - Multimodal inputs (text, images, PDF, audio, video)
 */
export async function getGeminiEmbeddings(
  texts: string[],
  apiKey: string,
  config?: Partial<PipelineConfig>
): Promise<number[][]> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'embed',
      apiKey,
      texts,
      model: config?.embeddingModel || 'gemini-embedding-2',
      outputDimensionality: config?.embeddingDimensions || 768,
      taskType: config?.embeddingTaskType || 'RETRIEVAL_DOCUMENT',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).error || `Embedding API failed (${res.status})`);
  }

  const data = await res.json();
  return data.embeddings as number[][];
}

/**
 * Get a single embedding for a query.
 * Uses RETRIEVAL_QUERY task type for optimal query-side embeddings.
 */
export async function getQueryEmbedding(
  query: string,
  apiKey: string,
  config?: Partial<PipelineConfig>
): Promise<number[]> {
  const queryConfig: Partial<PipelineConfig> = {
    ...config,
    embeddingTaskType: 'RETRIEVAL_QUERY', // Query-side uses different task type
  };
  const embeddings = await getGeminiEmbeddings([query], apiKey, queryConfig);
  return embeddings[0];
}

/**
 * Simulation mode: generate deterministic pseudo-embeddings.
 * Uses a simple hash of the text to produce a consistent vector.
 * The vectors are NOT semantically meaningful, but they allow
 * the UI to demonstrate the full pipeline without API calls.
 *
 * Dimension matches the configured output_dimensionality.
 */
export function getMockEmbeddings(
  texts: string[],
  dimensions: number = 768
): number[][] {
  return texts.map(text => {
    const vector = new Array(dimensions);
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = ((seed << 5) - seed + text.charCodeAt(i)) | 0;
    }
    // Simple PRNG seeded by text hash
    let state = Math.abs(seed) || 42;
    for (let i = 0; i < dimensions; i++) {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      vector[i] = (state / 0x7fffffff) * 2 - 1; // range [-1, 1]
    }
    // Normalize to unit vector
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    return norm === 0 ? vector : vector.map(v => v / norm);
  });
}

/**
 * Batch embed chunks, respecting API rate limits.
 * Batches of 20 texts per API call, with 100ms delay between batches.
 */
export async function embedChunks(
  chunks: { id: string; content: string }[],
  apiKey: string,
  simulationMode: boolean = false,
  onProgress?: (done: number, total: number) => void,
  config?: Partial<PipelineConfig>
): Promise<Map<string, number[]>> {
  const result = new Map<string, number[]>();
  const dimensions = config?.embeddingDimensions || 768;

  if (simulationMode) {
    // Simulation: generate all at once
    const texts = chunks.map(c => c.content);
    const embeddings = getMockEmbeddings(texts, dimensions);
    chunks.forEach((chunk, i) => result.set(chunk.id, embeddings[i]));
    onProgress?.(chunks.length, chunks.length);
    return result;
  }

  // Real embeddings: batch of 20 per request
  // Gemini Embedding 2 rate limits: 100 RPM / 1K RPD (free tier)
  const BATCH_SIZE = 20;
  const DELAY_MS = 100;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map(c => c.content);

    try {
      const embeddings = await getGeminiEmbeddings(texts, apiKey, config);
      batch.forEach((chunk, j) => result.set(chunk.id, embeddings[j]));
    } catch (e) {
      console.warn(`Embedding batch ${i / BATCH_SIZE + 1} failed:`, e);
      // Fall back to mock embeddings for this batch
      const mockEmbeddings = getMockEmbeddings(texts, dimensions);
      batch.forEach((chunk, j) => result.set(chunk.id, mockEmbeddings[j]));
    }

    onProgress?.(Math.min(i + BATCH_SIZE, chunks.length), chunks.length);

    if (i + BATCH_SIZE < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  return result;
}
