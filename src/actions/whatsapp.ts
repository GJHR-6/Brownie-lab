'use server';

interface EnviarConfirmacionParams {
  telefono: string;
  nombre: string;
  orderId: string;
  seguimientoUrl: string;
}

export async function enviarConfirmacionWhatsApp({
  telefono,
  nombre,
  orderId,
  seguimientoUrl,
}: EnviarConfirmacionParams): Promise<{ success: boolean; error?: string }> {
  const token         = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName  = process.env.WHATSAPP_TEMPLATE_NAME ?? 'order_confirmation';

  if (!token || !phoneNumberId) {
    // Not configured — skip silently (order already saved)
    return { success: false, error: 'WhatsApp API no configurado.' };
  }

  // Clean phone: digits only. If 8 digits (Honduras local), prepend 504.
  const digits = telefono.replace(/\D/g, '');
  const phone  = digits.length === 8 ? `504${digits}` : digits;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'es' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: nombre },
                  { type: 'text', text: orderId.slice(0, 8).toUpperCase() },
                  { type: 'text', text: seguimientoUrl },
                ],
              },
            ],
          },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message ?? 'Error Meta API.' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function enviarCodigoOtpWhatsApp(
  telefono: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const token         = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName  = process.env.WHATSAPP_OTP_TEMPLATE_NAME ?? 'otp_verification';

  if (!token || !phoneNumberId) {
    // Not configured — caller falls back to dev-mode code display.
    return { success: false, error: 'WhatsApp API no configurado.' };
  }

  const digits = telefono.replace(/\D/g, '');
  const phone  = digits.length === 8 ? `504${digits}` : digits;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'es' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: code }],
              },
            ],
          },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message ?? 'Error Meta API.' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
