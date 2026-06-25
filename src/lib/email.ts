import nodemailer from 'nodemailer';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export interface PedidoEmailItem {
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface PedidoEmailData {
  id: string;
  total: number;
  costo_envio?: number;
  items: PedidoEmailItem[];
  cliente: {
    nombre: string;
    telefono?: string;
    tipo_entrega?: string;
    direccion?: string;
    sede_pickup?: string;
    fecha_entrega?: string;
    hora_entrega?: string;
    metodo_pago?: string;
    notas?: string;
    comprobante_url?: string;
  };
}

async function getAdminEmails(): Promise<string[]> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase.from('admin_users').select('email');
  return (data ?? []).map((r: { email: string }) => r.email).filter(Boolean);
}

function buildEmailHtml(pedido: PedidoEmailData): string {
  const { id, total, costo_envio, items, cliente } = pedido;
  const idCorto = id.slice(0, 8).toUpperCase();

  const entregaLabel =
    cliente.tipo_entrega === 'domicilio'
      ? `Domicilio — ${cliente.direccion ?? 'Sin dirección'}`
      : cliente.tipo_entrega === 'pickup'
      ? `Pickup — ${cliente.sede_pickup ?? 'Sin sede'}`
      : '—';

  const fechaHora = [cliente.fecha_entrega, cliente.hora_entrega].filter(Boolean).join(' a las ') || '—';
  const metodoPago = cliente.metodo_pago === 'efectivo' ? 'Efectivo' : cliente.metodo_pago === 'transferencia' ? 'Transferencia' : '—';

  const itemsHtml = items
    .map(
      item => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #f0ece4;">${item.nombre}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #f0ece4;text-align:center;">${item.cantidad}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #f0ece4;text-align:right;">L. ${(item.precio * item.cantidad).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Georgia,serif;color:#3b2f1e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#4a2c0a;padding:28px 32px;text-align:center;">
          <p style="margin:0;color:#f5e6c8;font-size:22px;font-weight:bold;letter-spacing:1px;">🍫 Nuevo Pedido</p>
          <p style="margin:6px 0 0;color:#c8a97a;font-size:14px;">Pedido #${idCorto}</p>
        </td></tr>

        <!-- Cliente -->
        <tr><td style="padding:24px 32px 0;">
          <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#4a2c0a;border-bottom:2px solid #f0ece4;padding-bottom:8px;">Datos del cliente</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#6b4c2a;font-size:13px;width:130px;">Nombre</td>
              <td style="padding:4px 0;font-size:14px;font-weight:bold;">${cliente.nombre}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b4c2a;font-size:13px;">Teléfono</td>
              <td style="padding:4px 0;font-size:14px;">${cliente.telefono ?? '—'}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b4c2a;font-size:13px;">Entrega</td>
              <td style="padding:4px 0;font-size:14px;">${entregaLabel}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b4c2a;font-size:13px;">Fecha / Hora</td>
              <td style="padding:4px 0;font-size:14px;">${fechaHora}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b4c2a;font-size:13px;">Pago</td>
              <td style="padding:4px 0;font-size:14px;">${metodoPago}</td>
            </tr>
            ${cliente.notas ? `<tr>
              <td style="padding:4px 0;color:#6b4c2a;font-size:13px;">Notas</td>
              <td style="padding:4px 0;font-size:14px;">${cliente.notas}</td>
            </tr>` : ''}
          </table>
        </td></tr>

        <!-- Productos -->
        <tr><td style="padding:24px 32px 0;">
          <p style="margin:0 0 12px;font-size:18px;font-weight:bold;color:#4a2c0a;border-bottom:2px solid #f0ece4;padding-bottom:8px;">Productos</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            <tr style="background:#faf7f2;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b4c2a;font-weight:normal;text-transform:uppercase;letter-spacing:0.5px;">Producto</th>
              <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b4c2a;font-weight:normal;text-transform:uppercase;letter-spacing:0.5px;">Cant.</th>
              <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b4c2a;font-weight:normal;text-transform:uppercase;letter-spacing:0.5px;">Subtotal</th>
            </tr>
            ${itemsHtml}
          </table>
        </td></tr>

        <!-- Total -->
        <tr><td style="padding:16px 32px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${costo_envio ? `
            <tr>
              <td></td>
              <td style="text-align:right;padding:2px 0;font-size:13px;color:#6b4c2a;">Envío&nbsp;&nbsp;L. ${costo_envio.toFixed(2)}</td>
            </tr>` : ''}
            <tr>
              <td></td>
              <td style="text-align:right;padding:12px 0 0;border-top:2px solid #4a2c0a;">
                <span style="font-size:13px;color:#6b4c2a;">TOTAL&nbsp;&nbsp;</span>
                <span style="font-size:22px;font-weight:bold;color:#4a2c0a;">L. ${total.toFixed(2)}</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Comprobante -->
        ${cliente.comprobante_url ? `
        <tr><td style="padding:0 32px 24px;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#4a2c0a;text-transform:uppercase;letter-spacing:.06em;">Comprobante de pago</p>
          <a href="${cliente.comprobante_url}" target="_blank" style="display:block;">
            <img src="${cliente.comprobante_url}" alt="Comprobante de pago" style="width:100%;max-width:536px;border-radius:10px;border:1px solid #e8ddd0;display:block;" />
          </a>
          <p style="margin:6px 0 0;font-size:11px;color:#8c6e4a;">Toca la imagen para verla en tamaño completo</p>
        </td></tr>` : ''}

        <!-- Footer -->
        <tr><td style="background:#f0ece4;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#8c6e4a;">Brownie Lab · Notificación automática de pedido</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function notificarNuevoPedido(pedido: PedidoEmailData): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;

  const emails = await getAdminEmails();
  if (!emails.length) return;

  const transporter = createTransporter();
  const html = buildEmailHtml(pedido);
  const subject = `Nuevo pedido #${pedido.id.slice(0, 8).toUpperCase()} — ${pedido.cliente.nombre}`;

  await Promise.all(
    emails.map(to =>
      transporter.sendMail({ from: process.env.GMAIL_USER, to, subject, html }).catch(err =>
        console.error(`[email] Error enviando a ${to}:`, err)
      )
    )
  );
}
