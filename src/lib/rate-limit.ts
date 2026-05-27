interface RateLimitRecord {
  count: number;
  reset: number;
}

// In-process store — persists across requests within the same Node.js instance.
const store = new Map<string, RateLimitRecord>();

// Periodically evict expired entries to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of store) {
    if (now > rec.reset) store.delete(key);
  }
}, 60_000);

/**
 * Returns true if the request is allowed, false if rate limit exceeded.
 * @param key      Unique identifier (e.g. `ip:route`)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const rec = store.get(key);

  if (!rec || now > rec.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }

  if (rec.count >= limit) return false;

  rec.count++;
  return true;
}

export function rateLimitResponse(): Response {
  return Response.json(
    { error: 'Demasiadas solicitudes. Intenta más tarde.' },
    { status: 429, headers: { 'Retry-After': '60' } }
  );
}

// Helper for server actions — extract IP from Next.js request headers.
export function getIpFromHeaders(headersList: { get(name: string): string | null }): string {
  return (
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ??
    headersList.get('x-real-ip') ??
    'unknown'
  );
}
