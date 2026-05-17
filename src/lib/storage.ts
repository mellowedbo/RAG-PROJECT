/**
 * Storage Abstraction
 * Hot: localStorage (fast, small, ~5MB limit)
 * Cold: IndexedDB (slower, large, ~50MB+ limit)
 */

import type { DocInfo, ChunkInfo } from '@/types';

const HOT_DOCS_KEY = 'nexus-docs';
const HOT_CHUNKS_KEY = 'nexus-chunks';
const HOT_API_KEY = 'nexus-gemini-key';
const HOT_CONFIG_KEY = 'nexus-config';
const COLD_DB_NAME = 'nexus-vectordb';
const COLD_STORE_NAME = 'chunks';
const COLD_DB_VERSION = 1;

// Hot Storage (localStorage)

export function saveDocsToHot(docs: DocInfo[]): void {
  try {
    localStorage.setItem(HOT_DOCS_KEY, JSON.stringify(docs));
  } catch (e) {
    console.warn('localStorage write failed (docs):', e);
  }
}

export function loadDocsFromHot(): DocInfo[] {
  try {
    return JSON.parse(localStorage.getItem(HOT_DOCS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveChunksToHot(chunks: ChunkInfo[]): void {
  try {
    localStorage.setItem(HOT_CHUNKS_KEY, JSON.stringify(chunks));
  } catch (e) {
    console.warn('localStorage write failed (chunks):', e);
    // If quota exceeded, try saving without embeddings
    try {
      const slim = chunks.map(({ embedding: _embedding, ...rest }) => rest);
      localStorage.setItem(HOT_CHUNKS_KEY, JSON.stringify(slim));
    } catch {
      console.error('localStorage write failed even without embeddings');
    }
  }
}

export function loadChunksFromHot(): ChunkInfo[] {
  try {
    return JSON.parse(localStorage.getItem(HOT_CHUNKS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveApiKeyToHot(key: string): void {
  localStorage.setItem(HOT_API_KEY, key);
}

export function loadApiKeyFromHot(): string {
  return localStorage.getItem(HOT_API_KEY) || '';
}

export function saveConfigToHot(config: Record<string, unknown>): void {
  try {
    localStorage.setItem(HOT_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function loadConfigFromHot(): Record<string, unknown> | null {
  try {
    return JSON.parse(localStorage.getItem(HOT_CONFIG_KEY) || 'null');
  } catch {
    return null;
  }
}

// Cold Storage (IndexedDB)

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(COLD_DB_NAME, COLD_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(COLD_STORE_NAME)) {
        const store = db.createObjectStore(COLD_STORE_NAME, { keyPath: 'id' });
        store.createIndex('documentId', 'documentId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveChunksToCold(chunks: ChunkInfo[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(COLD_STORE_NAME, 'readwrite');
    const store = tx.objectStore(COLD_STORE_NAME);
    for (const chunk of chunks) {
      store.put(chunk);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('IndexedDB write failed:', e);
  }
}

export async function loadChunksFromCold(): Promise<ChunkInfo[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(COLD_STORE_NAME, 'readonly');
    const store = tx.objectStore(COLD_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function deleteChunksFromCold(documentId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(COLD_STORE_NAME, 'readwrite');
    const store = tx.objectStore(COLD_STORE_NAME);
    const index = store.index('documentId');
    const request = index.getAllKeys(documentId);
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        for (const key of request.result) {
          store.delete(key);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => resolve();
    });
  } catch {
    // ignore
  }
}

export async function clearColdStorage(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(COLD_STORE_NAME, 'readwrite');
    tx.objectStore(COLD_STORE_NAME).clear();
  } catch {
    // ignore
  }
}
