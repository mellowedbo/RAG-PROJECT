/* ═══════════════════════════════════════════════════════════
   NEXUS — Vector Database (In-Memory + IndexedDB)
   Brute-force cosine similarity search for <10K chunks.
   No external dependency needed.
   ═══════════════════════════════════════════════════════════ */

import type { ChunkInfo, VectorSearchResult } from '@/types';
import { cosineSimilarity } from '@/lib/retriever';

interface VectorEntry {
  id: string;
  vector: number[];
  metadata: ChunkInfo;
}

export class MemoryVectorDB {
  private entries: VectorEntry[] = [];

  /** Add vectors with metadata */
  addVectors(entries: VectorEntry[]): void {
    this.entries.push(...entries);
  }

  /** Search by query vector, return top-K results */
  search(queryVector: number[], topK: number = 8): VectorSearchResult[] {
    const scored = this.entries
      .filter(e => e.vector.length > 0)
      .map(entry => ({
        id: entry.id,
        score: cosineSimilarity(queryVector, entry.vector),
        metadata: entry.metadata,
      }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /** Get all entries */
  getAll(): VectorEntry[] {
    return this.entries;
  }

  /** Count entries */
  get size(): number {
    return this.entries.length;
  }

  /** Remove entries by document ID */
  deleteByDocumentId(documentId: string): void {
    this.entries = this.entries.filter(e => e.metadata.documentId !== documentId);
  }

  /** Clear all entries */
  clear(): void {
    this.entries = [];
  }

  /** Serialize to JSON for localStorage persistence */
  serialize(): string {
    return JSON.stringify(this.entries);
  }

  /** Deserialize from JSON */
  static deserialize(json: string): MemoryVectorDB {
    const db = new MemoryVectorDB();
    try {
      const entries = JSON.parse(json) as VectorEntry[];
      db.entries = entries;
    } catch {
      // ignore corrupt data
    }
    return db;
  }
}
