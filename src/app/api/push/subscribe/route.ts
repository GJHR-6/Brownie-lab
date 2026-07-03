import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitPersistente, rateLimitResponse } from '@/lib/rate-limit';
import { isValidPushEndpoint, isValidBase64 } from '@/lib/sanitize';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest): Promise<Response> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';

  if (!(await rateLimitPersistente(`push-subscribe:${ip}`, 5, 60 * 60 * 1000))) {
    return rateLimitResponse();
  }

  try {
    const body = await request.json();
    const { endpoint, keys } = body ?? {};

    if (
      !isValidPushEndpoint(endpoint) ||
      !isValidBase64(keys?.p256dh, 256) ||
      !isValidBase64(keys?.auth, 64)
    ) {
      return Response.json({ error: 'Datos de suscripción inválidos.' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    await supabase
      .from('push_subscriptions')
      .upsert({ endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'endpoint' });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Error interno.' }, { status: 500 });
  }
}
