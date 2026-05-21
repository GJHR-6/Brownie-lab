import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { endpoint, keys } = await request.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return Response.json({ error: 'Datos de suscripción incompletos.' }, { status: 400 });
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
