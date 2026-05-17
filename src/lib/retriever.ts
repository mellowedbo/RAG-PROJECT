/**
 * Retriever
 * TF-IDF fallback + cosine similarity on embeddings
 */

import type { ChunkInfo } from '@/types';

// TF-IDF Retriever (Fallback)

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor',
  'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all',
  'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only',
  'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when',
  'where', 'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
  'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him',
  'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their',
]);

function extractTerms(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

export function scoreChunksByTFIDF(
  query: string,
  chunks: ChunkInfo[],
  topK: number = 8
): (ChunkInfo & { score: number })[] {
  const queryTerms = extractTerms(query);
  if (queryTerms.length === 0) return chunks.slice(0, topK).map(c => ({ ...c, score: 0 }));

  const df: Record<string, number> = {};
  const totalDocs = chunks.length;

  for (const term of queryTerms) {
    df[term] = 0;
    for (const chunk of chunks) {
      if (chunk.content.toLowerCase().includes(term)) {
        df[term]++;
      }
    }
  }

  const scored = chunks.map(chunk => {
    const chunkTerms = extractTerms(chunk.content);
    const chunkTermFreq: Record<string, number> = {};
    for (const t of chunkTerms) {
      chunkTermFreq[t] = (chunkTermFreq[t] || 0) + 1;
    }

    let score = 0;
    for (const qt of queryTerms) {
      const tf = chunkTermFreq[qt] || 0;
      const idf = Math.log((totalDocs + 1) / ((df[qt] || 0) + 1)) + 1;
      score += tf * idf;
    }

    // Section-heading bonus: 1.5x if section contains query terms
    if (chunk.section) {
      for (const qt of queryTerms) {
        if (chunk.section.toLowerCase().includes(qt)) {
          score *= 1.5;
          break; // only boost once per chunk
        }
      }
    }

    // Normalize by sqrt(chunk length) to prevent long chunks from dominating
    const normalizedScore = score / Math.max(Math.sqrt(chunkTerms.length), 1);
    return { ...chunk, score: normalizedScore };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

// Cosine Similarity Retriever

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export function retrieveByEmbedding(
  queryEmbedding: number[],
  chunks: ChunkInfo[],
  topK: number = 8
): (ChunkInfo & { score: number })[] {
  const scored = chunks
    .filter(c => c.embedding && c.embedding.length > 0)
    .map(chunk => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding!),
    }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
