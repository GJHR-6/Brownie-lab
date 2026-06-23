import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'bl_otp_session';
const MAX_AGE_SECONDS = 60 * 60; // 1h sliding

interface OtpSessionPayload {
  telefono: string;
  iat: number;
}

function secret(): string {
  const s = process.env.OTP_SESSION_SECRET;
  if (!s) throw new Error('Missing OTP_SESSION_SECRET env var');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export async function setOtpSession(telefono: string): Promise<void> {
  const payload: OtpSessionPayload = { telefono, iat: Date.now() };
  const json = JSON.stringify(payload);
  const data = Buffer.from(json).toString('base64url');
  const sig = sign(data);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${data}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  });
}

export async function getOtpSession(): Promise<{ telefono: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [data, sig] = raw.split('.');
  if (!data || !sig) return null;

  const expected = sign(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as OtpSessionPayload;
    if (Date.now() - payload.iat > MAX_AGE_SECONDS * 1000) return null;
    return { telefono: payload.telefono };
  } catch {
    return null;
  }
}

export async function clearOtpSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
