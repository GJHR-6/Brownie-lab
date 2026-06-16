// Mensajes de WhatsApp al cliente según el estado del pedido (lado admin).
// Client-side: abre wa.me en pestaña nueva.

import type { Pedido, EstadoPedido, ClienteDatos } from '@/types/database';

function mensajePorEstado(estado: EstadoPedido, nombre: string, id: string, seguimientoUrl: string): string {
  const firma = '¡Gracias por tu compra en Brownie Lab! 🍪';
  switch (estado) {
    case 'preparacion':
      return [
        `¡Hola ${nombre}! 🍪`, '',
        `Tu pedido *#${id}* ha sido confirmado y está siendo preparado con mucho amor. 💛`, '',
        `📍 Rastrea tu pedido:`, seguimientoUrl, '',
        firma,
      ].join('\n');
    case 'listo':
      return [
        `¡Hola ${nombre}! 🎉`, '',
        `¡Tu pedido *#${id}* está *listo*! Ya puedes pasar a recogerlo, o pronto saldrá en camino si es a domicilio. 🚚`, '',
        firma,
      ].join('\n');
    case 'completado':
      return [
        `¡Hola ${nombre}! 💛`, '',
        `Tu pedido *#${id}* fue entregado. ¡Esperamos que lo disfrutes!`, '',
        `⭐ Si te gustó, nos ayudaría muchísimo tu reseña o recomendación.`, '',
        firma,
      ].join('\n');
    case 'cancelado':
      return [
        `Hola ${nombre},`, '',
        `Tu pedido *#${id}* fue cancelado. Si fue un error o quieres reactivarlo, respóndenos por aquí y lo resolvemos. 🙏`,
      ].join('\n');
    case 'pendiente':
    default:
      return [
        `¡Hola ${nombre}! 🍪`, '',
        `Recibimos tu pedido *#${id}* y lo confirmaremos en breve. 💛`, '',
        `📍 Rastrea tu pedido:`, seguimientoUrl, '',
        firma,
      ].join('\n');
  }
}

export function abrirWhatsAppPedido(pedido: Pedido, estado?: EstadoPedido): void {
  const cd = pedido.cliente_datos as ClienteDatos;
  if (!cd.telefono) return;
  const tel = cd.telefono.replace(/\D/g, '');
  const id = pedido.id.slice(0, 8).toUpperCase();
  const origen = typeof window !== 'undefined' ? window.location.origin : '';
  const msg = mensajePorEstado(estado ?? pedido.estado, cd.nombre, id, `${origen}/seguimiento`);
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
}
