import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitPersistente, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';
import { NextRequest } from 'next/server';
import webpush from 'web-push';

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  ?? '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? '';
const VAPID_EMAIL   = process.env.VAPID_EMAIL       ?? 'mailto:admin@brownielab.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function POST(request: NextRequest): Promise<Response> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';

  if (!(await rateLimitPersistente(`push-send:${ip}`, 10, 60 * 60 * 1000))) {
    return rateLimitResponse();
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Admin-only: verify authenticated user is in admin_users table.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 });

    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!adminRecord) return Response.json({ error: 'No autorizado.' }, { status: 403 });

    const body = await request.json();
    const title = sanitizeText(body?.title, 100);
    const text  = sanitizeText(body?.body,  300);
    const url   = sanitizeText(body?.url,   200) || '/';

    if (!title) return Response.json({ error: 'Título requerido.' }, { status: 400 });

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth');

    if (!subs?.length) return Response.json({ sent: 0 });

    const payload = JSON.stringify({ title, body: text, url });
    let sent = 0;

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err: unknown) {
          if ((err as { statusCode?: number }).statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      })
    );

    return Response.json({ sent });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
