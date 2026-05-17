/**
 * Rate Limiting (Demo Key Protection)
 * Cookie-based session tracking + per-IP limiting
 * Note: In-memory Map resets on serverless cold start
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const MAX_REQUESTS_PER_DAY = 10;

/** Clean up expired entries */
function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

/** Check if a request is allowed, return remaining count or -1 if blocked */
export function checkRateLimit(sessionId: string, ip?: string): { allowed: boolean; remaining: number } {
  cleanup();

  // Check by session ID (primary)
  const key = ip ? `${sessionId}:${ip}` : sessionId;
  const now = Date.now();
  const existing = rateLimitMap.get(key);

  if (!existing || now > existing.resetAt) {
    // New window: 24 hours from now
    rateLimitMap.set(key, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - 1 };
  }

  if (existing.count >= MAX_REQUESTS_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }

  existing.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - existing.count };
}

/** Get current usage for a session */
export function getUsage(sessionId: string): { used: number; limit: number } {
  const entry = rateLimitMap.get(sessionId);
  if (!entry || Date.now() > entry.resetAt) {
    return { used: 0, limit: MAX_REQUESTS_PER_DAY };
  }
  return { used: entry.count, limit: MAX_REQUESTS_PER_DAY };
}
