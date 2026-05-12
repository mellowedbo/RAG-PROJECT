/* ═══════════════════════════════════════════════════════════
   NEXUS — Embeddings Client
   Gemini text-embedding-004 via /api/gemini route
   Simulation mode returns deterministic mock vectors
   ═══════════════════════════════════════════════════════════ */

const EMBEDDING_DIM = 768;

/**
 * Get real embeddings via Gemini API (server-side proxy).
 * Calls /api/gemini with mode="embed".
 */
export async function getGeminiEmbeddings(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'embed', apiKey, texts }),
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
 */
export async function getQueryEmbedding(
  query: string,
  apiKey: string
): Promise<number[]> {
  const embeddings = await getGeminiEmbeddings([query], apiKey);
  return embeddings[0];
}

/**
 * Simulation mode: generate deterministic pseudo-embeddings.
 * Uses a simple hash of the text to produce a consistent vector.
 * The vectors are NOT semantically meaningful, but they allow
 * the UI to demonstrate the full pipeline without API calls.
 */
export function getMockEmbeddings(texts: string[]): number[][] {
  return texts.map(text => {
    const vector = new Array(EMBEDDING_DIM);
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = ((seed << 5) - seed + text.charCodeAt(i)) | 0;
    }
    // Simple PRNG seeded by text hash
    let state = Math.abs(seed) || 42;
    for (let i = 0; i < EMBEDDING_DIM; i++) {
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
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, number[]>> {
  const result = new Map<string, number[]>();

  if (simulationMode) {
    // Simulation: generate all at once
    const texts = chunks.map(c => c.content);
    const embeddings = getMockEmbeddings(texts);
    chunks.forEach((chunk, i) => result.set(chunk.id, embeddings[i]));
    onProgress?.(chunks.length, chunks.length);
    return result;
  }

  // Real embeddings: batch of 20 per request
  const BATCH_SIZE = 20;
  const DELAY_MS = 100;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map(c => c.content);

    try {
      const embeddings = await getGeminiEmbeddings(texts, apiKey);
      batch.forEach((chunk, j) => result.set(chunk.id, embeddings[j]));
    } catch (e) {
      console.warn(`Embedding batch ${i / BATCH_SIZE + 1} failed:`, e);
      // Fall back to mock embeddings for this batch
      const mockEmbeddings = getMockEmbeddings(texts);
      batch.forEach((chunk, j) => result.set(chunk.id, mockEmbeddings[j]));
    }

    onProgress?.(Math.min(i + BATCH_SIZE, chunks.length), chunks.length);

    if (i + BATCH_SIZE < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  return result;
}
