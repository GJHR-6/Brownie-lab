import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

const WEBHOOK_URL = process.env.ADMIN_WEBHOOK_URL ?? '';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const codigo: string = (body.codigo ?? '').toUpperCase().trim();
    const telefono: string = (body.telefono ?? '').replace(/\D/g, '');

    if (!codigo || !telefono) {
      return NextResponse.json(
        { error: 'Se requieren "codigo" y "telefono"' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceClient();

    // Verificar cupón válido y que pertenezca al teléfono
    const { data: cupon, error } = await supabase
      .from('cupones')
      .select('id, codigo_unico, estado, clientes(nombre, telefono)')
      .eq('codigo_unico', codigo)
      .eq('telefono_cliente', telefono)
      .eq('estado', 'DISPONIBLE')
      .single();

    if (error || !cupon) {
      return NextResponse.json(
        { valid: false, error: 'Cupón inválido, ya utilizado, o no pertenece a este teléfono' },
        { status: 404 }
      );
    }

    // Marcar como utilizado atómicamente
    const { error: updateError } = await supabase
      .from('cupones')
      .update({ estado: 'UTILIZADO', used_at: new Date().toISOString() })
      .eq('id', cupon.id)
      .eq('estado', 'DISPONIBLE'); // protección race condition

    if (updateError) {
      return NextResponse.json(
        { valid: false, error: 'Error al procesar el cupón. Intenta de nuevo.' },
        { status: 500 }
      );
    }

    const clienteInfo = Array.isArray(cupon.clientes) ? cupon.clientes[0] : cupon.clientes;
    const nombreCliente = clienteInfo?.nombre || telefono;

    // Notificación a admin/cocina (fire-and-forget, no bloquea la respuesta)
    if (WEBHOOK_URL) {
      fetch(WEBHOOK_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          type:      'PREMIO_CANJEADO',
          mensaje:   `🎉 ¡Alerta de Premio! El cliente ${nombreCliente} (${telefono}) canjeó el cupón ${codigo}. Su orden incluye un BROWNIE GRATIS.`,
          codigo,
          telefono,
          nombre:    nombreCliente,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {}); // ignorar errores de webhook
    }

    return NextResponse.json({
      valid:      true,
      descuento:  '1 brownie gratis',
      cliente:    nombreCliente,
      cuponId:    cupon.id,
    });
  } catch (err) {
    console.error('[Validar cupón]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
