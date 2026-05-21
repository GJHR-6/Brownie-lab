import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import webpush from 'web-push';

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  ?? '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? '';
const VAPID_EMAIL   = process.env.VAPID_EMAIL       ?? 'mailto:admin@brownielab.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { title, body, url = '/' } = await request.json();

    const supabase = await createSupabaseServerClient();
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth');

    if (!subs?.length) return Response.json({ sent: 0 });

    const payload = JSON.stringify({ title, body, url });
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
          // Remove expired subscriptions
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
