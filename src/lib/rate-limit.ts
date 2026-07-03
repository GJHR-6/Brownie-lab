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

/**
 * Rate limit persistente entre instancias serverless (tabla rate_limits en
 * Supabase, RPC atómica). Si la BD no responde cae al Map en memoria — nunca
 * bloquea el sitio por un fallo del limitador.
 *
 * Usar en endpoints sensibles (OTP, pedidos, cupones); para checks baratos
 * el rateLimit() en memoria sigue disponible.
 */
export async function rateLimitPersistente(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  try {
    const { createSupabaseServiceClient } = await import('@/lib/supabase/service');
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.rpc('rate_limit_hit', {
      key_input: key,
      max_count: limit,
      window_ms: windowMs,
    });
    if (error) throw error;
    return data === true;
  } catch {
    return rateLimit(key, limit, windowMs);
  }
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
