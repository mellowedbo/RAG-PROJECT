import { NextRequest, NextResponse } from 'next/server';
import {
  GENERATION_MODELS,
  EMBEDDING_MODELS,
  type ModelHealthStatus,
} from '@/types';

/**
 * Model Health Check Endpoint
 * Tests each generation and embedding model with a minimal request,
 * returns availability, latency, and error info.
 *
 * Rate-limited: 1 health check per 5 minutes per session.
 * Results cached in-memory for 5 minutes.
 */

// ─── In-memory cache ──────────────────────────────────────────────────────────

interface CachedResult {
  results: ModelHealthStatus[];
  testedAt: string;
}

const healthCache = new Map<string, CachedResult>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Rate limiter for health checks ──────────────────────────────────────────

const healthRateLimitMap = new Map<string, number>(); // sessionId → lastCheckTimestamp
const HEALTH_RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

// ─── Timeout wrapper ─────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ─── Test a single generation model ──────────────────────────────────────────

async function testGenerationModel(
  apiKey: string,
  modelId: string
): Promise<ModelHealthStatus> {
  const start = Date.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const res = await withTimeout(
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
          generationConfig: { maxOutputTokens: 1 },
        }),
      }),
      10_000
    );

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = (errData as Record<string, unknown>)?.error
        ? ((errData as Record<string, unknown>).error as Record<string, unknown>)?.message ||
          `HTTP ${res.status}`
        : `HTTP ${res.status}`;
      return {
        modelId,
        available: false,
        latencyMs,
        error: typeof errMsg === 'string' ? errMsg : `HTTP ${res.status}`,
        testedAt: new Date().toISOString(),
      };
    }

    return {
      modelId,
      available: true,
      latencyMs,
      error: null,
      testedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      modelId,
      available: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
      testedAt: new Date().toISOString(),
    };
  }
}

// ─── Test a single embedding model ───────────────────────────────────────────

async function testEmbeddingModel(
  apiKey: string,
  modelId: string
): Promise<ModelHealthStatus> {
  const start = Date.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:batchEmbedContents?key=${apiKey}`;
    const res = await withTimeout(
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              model: `models/${modelId}`,
              content: { parts: [{ text: 'test' }] },
            },
          ],
        }),
      }),
      10_000
    );

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = (errData as Record<string, unknown>)?.error
        ? ((errData as Record<string, unknown>).error as Record<string, unknown>)?.message ||
          `HTTP ${res.status}`
        : `HTTP ${res.status}`;
      return {
        modelId,
        available: false,
        latencyMs,
        error: typeof errMsg === 'string' ? errMsg : `HTTP ${res.status}`,
        testedAt: new Date().toISOString(),
      };
    }

    return {
      modelId,
      available: true,
      latencyMs,
      error: null,
      testedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      modelId,
      available: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
      testedAt: new Date().toISOString(),
    };
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body as { apiKey?: string };

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      );
    }

    // Rate limit: 1 health check per 5 minutes per session
    const sessionId = request.headers.get('x-session-id') || 'anonymous';
    const now = Date.now();
    const lastCheck = healthRateLimitMap.get(sessionId);

    if (lastCheck && now - lastCheck < HEALTH_RATE_LIMIT_MS) {
      // Return cached result if available
      const cached = healthCache.get(sessionId);
      if (cached && now - new Date(cached.testedAt).getTime() < CACHE_TTL_MS) {
        return NextResponse.json({
          results: cached.results,
          cached: true,
          nextCheckAt: new Date(lastCheck + HEALTH_RATE_LIMIT_MS).toISOString(),
        });
      }

      const waitSeconds = Math.ceil(
        (HEALTH_RATE_LIMIT_MS - (now - lastCheck)) / 1000
      );
      return NextResponse.json(
        {
          error: `Health check rate limited. Please wait ${waitSeconds}s before trying again.`,
          nextCheckAt: new Date(lastCheck + HEALTH_RATE_LIMIT_MS).toISOString(),
        },
        { status: 429 }
      );
    }

    // Check cache for fresh results (any session, keyed by API key hash)
    const cacheKey = `key:${apiKey.slice(0, 8)}***`;
    const cachedEntry = healthCache.get(cacheKey);
    if (cachedEntry && now - new Date(cachedEntry.testedAt).getTime() < CACHE_TTL_MS) {
      // Update session rate limit
      healthRateLimitMap.set(sessionId, now);
      return NextResponse.json({
        results: cachedEntry.results,
        cached: true,
      });
    }

    // Run health checks in parallel
    const generationPromises = GENERATION_MODELS.map((m) =>
      testGenerationModel(apiKey, m.id)
    );
    const embeddingPromises = EMBEDDING_MODELS.map((m) =>
      testEmbeddingModel(apiKey, m.id)
    );

    const allResults = await Promise.allSettled([
      ...generationPromises,
      ...embeddingPromises,
    ]);

    // Extract results (settled promises always have value or reason)
    const results: ModelHealthStatus[] = allResults.map((r) => {
      if (r.status === 'fulfilled') {
        return r.value;
      }
      // This shouldn't happen since our test functions catch all errors,
      // but handle it gracefully
      return {
        modelId: 'unknown',
        available: false,
        latencyMs: null,
        error: r.reason instanceof Error ? r.reason.message : 'Unknown error',
        testedAt: new Date().toISOString(),
      };
    });

    // Cache results
    const testedAt = new Date().toISOString();
    const cacheEntry: CachedResult = { results, testedAt };
    healthCache.set(cacheKey, cacheEntry);
    healthCache.set(sessionId, cacheEntry);

    // Update rate limit
    healthRateLimitMap.set(sessionId, now);

    // Clean up old cache entries periodically
    for (const [key, entry] of healthCache) {
      if (now - new Date(entry.testedAt).getTime() > CACHE_TTL_MS * 2) {
        healthCache.delete(key);
      }
    }

    return NextResponse.json({
      results,
      cached: false,
      testedAt,
    });
  } catch (error) {
    console.error('[Model Health] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check model health. Please try again.' },
      { status: 500 }
    );
  }
}
