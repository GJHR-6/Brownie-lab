'use server';

import { createHash, randomInt } from 'crypto';
import { headers } from 'next/headers';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { rateLimit, getIpFromHeaders } from '@/lib/rate-limit';
import { sanitizePhone, isValidHonduranPhone, normalizePhone } from '@/lib/sanitize';
import { setOtpSession } from '@/lib/otpSession';
import { enviarCodigoOtpWhatsApp } from './whatsapp';
import type { ActionResult } from '@/types/actions';

const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(telefono: string, code: string): string {
  return createHash('sha256').update(`${telefono}:${code}`).digest('hex');
}

export async function generarOtp(
  telefono: string
): Promise<ActionResult<{ devCode?: string }>> {
  const ip = getIpFromHeaders(await headers());
  if (!rateLimit(`otp:send:${ip}`, 5, 15 * 60 * 1000)) {
    return { success: false, error: 'Demasiados intentos. Espera unos minutos.' };
  }

  const cleanPhone = sanitizePhone(telefono);
  if (!isValidHonduranPhone(cleanPhone)) {
    return { success: false, error: 'Ingresa un número hondureño válido (8 dígitos, empieza con 2, 3, 8 o 9).' };
  }
  const tel = normalizePhone(cleanPhone);

  if (!rateLimit(`otp:send:${tel}`, 3, 10 * 60 * 1000)) {
    return { success: false, error: 'Ya enviamos un código a este número. Espera unos minutos antes de pedir otro.' };
  }

  const code = String(randomInt(0, 10000)).padStart(4, '0');
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase.from('otp_codes').insert({
    telefono: tel,
    code_hash: hashCode(tel, code),
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });
  if (error) return { success: false, error: 'No se pudo generar el código. Intenta de nuevo.' };

  const sendResult = await enviarCodigoOtpWhatsApp(tel, code);

  if (sendResult.success) return { success: true, data: {} };

  // Fallback de desarrollo: si WhatsApp no está configurado y no estamos en
  // producción, devolvemos el código para no bloquear el flujo mientras se
  // aprueba la plantilla de Meta.
  if (process.env.NODE_ENV !== 'production') {
    return { success: true, data: { devCode: code } };
  }

  return { success: false, error: 'No se pudo enviar el código por WhatsApp. Intenta de nuevo.' };
}

export async function verificarOtp(
  telefono: string,
  code: string
): Promise<ActionResult<{ telefono: string }>> {
  const ip = getIpFromHeaders(await headers());
  if (!rateLimit(`otp:verify:${ip}`, 10, 15 * 60 * 1000)) {
    return { success: false, error: 'Demasiados intentos. Espera unos minutos.' };
  }

  const cleanPhone = sanitizePhone(telefono);
  if (!isValidHonduranPhone(cleanPhone)) {
    return { success: false, error: 'Número de teléfono inválido.' };
  }
  const tel = normalizePhone(cleanPhone);

  const cleanCode = code.replace(/\D/g, '').slice(0, 4);
  if (cleanCode.length !== 4) return { success: false, error: 'Código inválido.' };

  const supabase = createSupabaseServiceClient();

  const { data: row, error } = await supabase
    .from('otp_codes')
    .select('id, code_hash, expires_at, attempts, verified_at')
    .eq('telefono', tel)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !row) return { success: false, error: 'Solicita un nuevo código.' };
  if (row.verified_at) return { success: false, error: 'Este código ya fue usado. Solicita uno nuevo.' };
  if (new Date(row.expires_at).getTime() < Date.now()) return { success: false, error: 'El código expiró. Solicita uno nuevo.' };
  if (row.attempts >= MAX_ATTEMPTS) return { success: false, error: 'Demasiados intentos. Solicita un nuevo código.' };

  if (row.code_hash !== hashCode(tel, cleanCode)) {
    await supabase.from('otp_codes').update({ attempts: row.attempts + 1 }).eq('id', row.id);
    return { success: false, error: 'Código incorrecto.' };
  }

  await supabase.from('otp_codes').update({ verified_at: new Date().toISOString() }).eq('id', row.id);
  await setOtpSession(tel);

  return { success: true, data: { telefono: tel } };
}
