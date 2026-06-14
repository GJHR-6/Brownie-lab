'use server';

import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { rateLimit, getIpFromHeaders } from '@/lib/rate-limit';
import { sanitizeText, sanitizePhone, sanitizePromoCode, isValidHonduranPhone, normalizePhone } from '@/lib/sanitize';
import type { ActionResult } from '@/types/actions';
import type { ClienteDatos, EstadoPedido, PedidoItem } from '@/types/database';
import { parseConfigEnvio, calcularEnvio, calcularEnvioPorSede, type ConfigEnvio } from '@/lib/envio';
import { parseConfigPedidos, fechaMinimaEntrega, CONFIG_PEDIDOS_DEFAULT, type ConfigPedidos } from '@/lib/horarios';

// ── Validar código de promo ───────────────────────────────────────────────────

export async function validarPromocion(
  codigo: string
): Promise<ActionResult<{ codigo: string; descuento_porcentaje: number }>> {
  const ip = getIpFromHeaders(await headers());
  if (!rateLimit(`promo:${ip}`, 10, 5 * 60 * 1000)) {
    return { success: false, error: 'Demasiados intentos. Espera unos minutos.' };
  }

  const clean = sanitizePromoCode(codigo);
  if (!clean) return { success: false, error: 'Código de descuento no válido.' };

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('promociones')
      .select('id, codigo, descuento_porcentaje, usos_restantes, activa')
      .eq('codigo', clean.toUpperCase())
      .single();

    if (error || !data) return { success: false, error: 'Código de descuento no válido.' };
    if (!data.activa)             return { success: false, error: 'Este código ya no está activo.' };
    if (data.usos_restantes <= 0) return { success: false, error: 'Este código no tiene usos disponibles.' };

    await supabase
      .from('promociones')
      .update({ usos_restantes: data.usos_restantes - 1 })
      .eq('id', data.id);

    return { success: true, data: { codigo: data.codigo, descuento_porcentaje: data.descuento_porcentaje } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Seguimiento de pedido ────────────────────────────────────────────────────

export interface PedidoTrackingItem {
  nombre: string;
  cantidad: number;
  subtotal: number;
}

export interface PedidoTracking {
  id: string;
  estado: EstadoPedido;
  total: number;
  created_at: string;
  nombre_cliente: string;
  items: PedidoTrackingItem[];
}

export async function buscarPedidosPorTelefono(
  telefono: string
): Promise<ActionResult<PedidoTracking[]>> {
  const ip = getIpFromHeaders(await headers());
  if (!rateLimit(`track:${ip}`, 20, 5 * 60 * 1000)) {
    return { success: false, error: 'Demasiados intentos. Espera unos minutos.' };
  }

  const clean = sanitizePhone(telefono);
  if (!clean) return { success: false, error: 'Teléfono inválido.' };

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.rpc('get_pedidos_por_telefono', {
      telefono_input: clean,
    });

    if (error) return { success: false, error: 'Error al buscar pedidos.' };
    return { success: true, data: (data ?? []) as PedidoTracking[] };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

export async function buscarPedidoPorCodigo(
  codigo: string
): Promise<ActionResult<PedidoTracking | null>> {
  const ip = getIpFromHeaders(await headers());
  if (!rateLimit(`track-code:${ip}`, 15, 5 * 60 * 1000)) {
    return { success: false, error: 'Demasiados intentos. Espera unos minutos.' };
  }

  const clean = codigo.replace(/^#/, '').trim().toUpperCase();
  if (!/^[0-9A-F]{6,8}$/i.test(clean)) {
    return { success: false, error: 'Código inválido. Debe tener entre 6 y 8 caracteres (ej: A1B2C3D4).' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_pedido_por_codigo', { codigo_input: clean });
    if (error) return { success: false, error: 'Error al buscar el pedido.' };
    const pedido = (data ?? [])[0] ?? null;
    if (!pedido) return { success: false, error: 'No encontramos ningún pedido con ese código.' };
    return { success: true, data: pedido as PedidoTracking };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Datos bancarios públicos ──────────────────────────────────────────────────

export async function getConfiguracionBanco(): Promise<{ banco: string; titular: string; numero: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('configuracion')
      .select('banco_nombre, banco_titular, banco_numero')
      .eq('id', 1)
      .single();
    return {
      banco:   data?.banco_nombre  ?? '',
      titular: data?.banco_titular ?? '',
      numero:  data?.banco_numero  ?? '',
    };
  } catch {
    return { banco: '', titular: '', numero: '' };
  }
}

export async function getConfiguracionEnvio(): Promise<ConfigEnvio> {
  const vacio: ConfigEnvio = { sedes: [], por_km: 0, factor_ruta: 1.3, km_max: 0, gratis_desde: 0 };
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('configuracion')
      .select('envio_sedes, envio_por_km, envio_factor_ruta, envio_km_max, envio_gratis_monto')
      .eq('id', 1)
      .single();
    return data ? parseConfigEnvio(data) : vacio;
  } catch {
    return vacio;
  }
}

// Toppings activos para recomendar como extra en el checkout
export async function getToppingsPublicos(): Promise<Array<{ id: string; nombre: string; precio_extra: number }>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('ingredientes')
      .select('id, nombre, precio_extra')
      .eq('es_topping', true)
      .eq('activo', true)
      .order('nombre');
    return (data ?? [])
      .map(t => ({ id: t.id as string, nombre: t.nombre as string, precio_extra: Number(t.precio_extra ?? 0) }))
      .filter(t => t.precio_extra > 0); // el checkout exige precio > 0 en items sin producto
  } catch {
    return [];
  }
}

export async function getConfiguracionPedidos(): Promise<ConfigPedidos> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('configuracion')
      .select('horas_entrega, hora_corte')
      .eq('id', 1)
      .single();
    return data ? parseConfigPedidos(data) : CONFIG_PEDIDOS_DEFAULT;
  } catch {
    return CONFIG_PEDIDOS_DEFAULT;
  }
}

// ── Crear pedido desde checkout público ──────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIPOS_ENTREGA  = new Set(['pickup', 'domicilio', '']);
const METODOS_PAGO   = new Set(['efectivo', 'transferencia', '']);

// Ubicación GPS del cliente o sede elegida a mano (fallback sin GPS)
export type EnvioInput = { lat: number; lng: number } | { sede: string };

export async function crearPedidoPublico(
  clienteDatos: ClienteDatos,
  items: PedidoItem[],
  _totalCliente: number,
  promo?: { codigo: string; descuento_porcentaje: number } | null,
  idempotencyKey?: string,
  envioInput?: EnvioInput | null
): Promise<ActionResult<{ id: string }>> {
  const ip = getIpFromHeaders(await headers());
  if (!rateLimit(`order:${ip}`, 5, 60 * 60 * 1000)) {
    return { success: false, error: 'Demasiados pedidos. Intenta más tarde.' };
  }

  // ── 1. Sanitizar datos del cliente ──────────────────────────────────────────
  const nombre    = sanitizeText(clienteDatos.nombre,    120);
  const telefono  = sanitizePhone(clienteDatos.telefono);
  const direccion = sanitizeText(clienteDatos.direccion, 300);
  const notas     = sanitizeText(clienteDatos.notas,     500);

  if (!nombre || !telefono)      return { success: false, error: 'Nombre y teléfono requeridos.' };
  if (!isValidHonduranPhone(telefono)) return { success: false, error: 'Ingresa un número de teléfono hondureño válido (8 dígitos, empieza con 2, 3, 8 o 9).' };

  if (clienteDatos.tipo_entrega && !TIPOS_ENTREGA.has(clienteDatos.tipo_entrega))
    return { success: false, error: 'Tipo de entrega inválido.' };
  if (clienteDatos.metodo_pago  && !METODOS_PAGO.has(clienteDatos.metodo_pago))
    return { success: false, error: 'Método de pago inválido.' };

  // Fecha y hora de entrega contra reglas configuradas (hora de corte + franjas)
  const cfgPedidos = await getConfiguracionPedidos();
  if (clienteDatos.fecha_entrega) {
    const minFecha = fechaMinimaEntrega(cfgPedidos.hora_corte);
    if (clienteDatos.fecha_entrega < minFecha) {
      return { success: false, error: `Por la hora del pedido, la entrega más próxima disponible es el ${minFecha}.` };
    }
  }
  if (clienteDatos.hora_entrega && !cfgPedidos.horas_entrega.includes(clienteDatos.hora_entrega)) {
    return { success: false, error: 'Hora de entrega inválida. Elige una de las franjas disponibles.' };
  }

  // ── 2. Validar items ────────────────────────────────────────────────────────
  if (!items.length || items.length > 100)
    return { success: false, error: 'El carrito está vacío o tiene demasiados items.' };
  if (items.some(i => !Number.isInteger(i.cantidad) || i.cantidad < 1 || i.cantidad > 99))
    return { success: false, error: 'Cantidad inválida (máx. 99 por producto).' };

  const sanitizedDatos: ClienteDatos = { ...clienteDatos, nombre, telefono, direccion, notas };

  try {
    const supabase = createSupabaseServiceClient();

    // ── 3. Obtener precios reales + validar stock ────────────────────────────
    const itemsConProducto = items.filter(
      (i): i is typeof i & { producto_id: string } => !!i.producto_id && UUID_RE.test(i.producto_id)
    );

    type ProdRow = { id: string; nombre: string; precio: number; stock: number };
    let prodMap = new Map<string, ProdRow>();

    if (itemsConProducto.length > 0) {
      const { data: prods } = await supabase
        .from('productos')
        .select('id, nombre, precio, stock')
        .in('id', itemsConProducto.map(i => i.producto_id));

      prodMap = new Map(
        (prods ?? []).map((p: ProdRow) => [p.id, { ...p, precio: Number(p.precio) }])
      );

      for (const item of itemsConProducto) {
        const prod = prodMap.get(item.producto_id);
        if (!prod) return { success: false, error: `Producto no encontrado: "${sanitizeText(item.nombre, 80)}".` };
        if (prod.stock < item.cantidad)
          return { success: false, error: `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock}.` };
      }
    }

    // ── 4. Construir items con precios reales y nombres saneados ────────────
    const sanitizedItems = items.map(item => {
      const realPrecio = item.producto_id && prodMap.has(item.producto_id)
        ? prodMap.get(item.producto_id)!.precio
        : item.precio;
      return { ...item, precio: realPrecio, nombre: sanitizeText(item.nombre, 200) };
    });

    // Validar rango de precio para ítems personalizados (sin producto_id)
    for (const item of sanitizedItems) {
      if (!item.producto_id) {
        if (typeof item.precio !== 'number' || item.precio < 1 || item.precio > 1000)
          return { success: false, error: 'Precio inválido en uno de los productos.' };
      }
    }

    // ── 5. Calcular total real en el servidor ────────────────────────────────
    const subtotalReal = Math.round(
      sanitizedItems.reduce((s, i) => s + i.precio * i.cantidad, 0) * 100
    ) / 100;

    // ── 6. Reverificar descuento del promo desde BD ──────────────────────────
    let descuento = 0;
    let nota_promo: string | undefined;
    if (promo) {
      const cleanCode = sanitizePromoCode(promo.codigo);
      const { data: promoData } = await supabase
        .from('promociones')
        .select('descuento_porcentaje, activa')
        .eq('codigo', cleanCode.toUpperCase())
        .single();

      if (!promoData || !promoData.activa)
        return { success: false, error: 'Código de descuento inválido o inactivo.' };

      descuento  = Math.round(subtotalReal * (promoData.descuento_porcentaje / 100) * 100) / 100;
      nota_promo = `Descuento ${cleanCode.toUpperCase()} (${promoData.descuento_porcentaje}%)`;
    }

    // ── 6.5 Calcular envío en el servidor (nunca confiar en el costo del cliente) ──
    let costoEnvio = 0;
    if (sanitizedDatos.tipo_entrega === 'domicilio') {
      const { data: cfgRaw } = await supabase
        .from('configuracion')
        .select('envio_sedes, envio_por_km, envio_factor_ruta, envio_km_max, envio_gratis_monto')
        .eq('id', 1)
        .single();
      const cfgEnvio = parseConfigEnvio(cfgRaw ?? {});

      if (cfgEnvio.sedes.length > 0) {
        const subtotalConDescuento = Math.round((subtotalReal - descuento) * 100) / 100;
        let resultado = null;

        if (envioInput && 'lat' in envioInput) {
          const { lat, lng } = envioInput;
          // Bounds aproximados de Honduras — rechaza coords basura
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 12.9 || lat > 16.6 || lng < -89.5 || lng > -83) {
            return { success: false, error: 'Ubicación de entrega inválida.' };
          }
          resultado = calcularEnvio(cfgEnvio, lat, lng, subtotalConDescuento);
          if (resultado?.fueraDeRango) {
            return { success: false, error: `Lo sentimos, tu ubicación está fuera de nuestra zona de entrega (máx. ${cfgEnvio.km_max} km).` };
          }
        } else if (envioInput && 'sede' in envioInput) {
          resultado = calcularEnvioPorSede(cfgEnvio, sanitizeText(envioInput.sede, 80), subtotalConDescuento);
          if (!resultado) return { success: false, error: 'Ciudad de entrega inválida.' };
        } else {
          return { success: false, error: 'Calcula el costo de envío antes de confirmar el pedido.' };
        }

        if (resultado) {
          costoEnvio = resultado.costo;
          sanitizedDatos.envio = {
            sede: resultado.sede.nombre,
            distancia_km: resultado.distancia_km,
            costo: resultado.costo,
            gratis: resultado.gratis,
          };
        }
      }
    }

    const totalReal = Math.round((subtotalReal - descuento + costoEnvio) * 100) / 100;
    if (totalReal <= 0) return { success: false, error: 'Total inválido.' };

    const datos = nota_promo
      ? { ...sanitizedDatos, notas: [sanitizedDatos.notas, nota_promo].filter(Boolean).join(' | ') }
      : sanitizedDatos;

    // ── 7. Upsert cliente + crear pedido ─────────────────────────────────────
    // Identidad del cliente normalizada (sin +504) para evitar duplicados en fidelización
    const telefonoNormalizado = normalizePhone(telefono);
    await supabase.from('clientes').upsert(
      { telefono: telefonoNormalizado, nombre },
      { onConflict: 'telefono', ignoreDuplicates: false }
    );

    const row: Record<string, unknown> = {
      cliente_datos: datos, total: totalReal, estado: 'pendiente',
      telefono_cliente: telefonoNormalizado, ip_origen: ip,
      // Columnas contables (además del JSON, para reportes queryables)
      metodo_pago: METODOS_PAGO.has(clienteDatos.metodo_pago ?? '') ? clienteDatos.metodo_pago : null,
      descuento,
      costo_envio: costoEnvio,
    };
    if (idempotencyKey) row.idempotency_key = idempotencyKey;

    const { data, error } = await supabase
      .from('pedidos')
      .insert(row)
      .select('id')
      .single();

    if (error?.code === '23505' && idempotencyKey) {
      const { data: existing } = await supabase
        .from('pedidos')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .single();
      if (existing) return { success: true, data: { id: existing.id } };
    }

    if (error) return { success: false, error: error.message };

    await supabase.from('pedido_items').insert(
      sanitizedItems.map(item => ({
        pedido_id:       data.id,
        producto_id:     item.producto_id || null,
        nombre_producto: item.nombre,
        precio_unitario: item.precio,
        cantidad:        item.cantidad,
      }))
    );

    return { success: true, data: { id: data.id } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}

// ── Subir comprobante de pago ─────────────────────────────────────────────────

export async function subirComprobante(
  pedidoId: string,
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const ip = getIpFromHeaders(await headers());
  if (!rateLimit(`comprobante:${ip}`, 5, 60 * 60 * 1000)) {
    return { success: false, error: 'Demasiados intentos.' };
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pedidoId)) {
    return { success: false, error: 'ID de pedido inválido.' };
  }

  const file = formData.get('comprobante') as File | null;
  if (!file || file.size === 0) return { success: false, error: 'Archivo requerido.' };
  if (file.size > 10 * 1024 * 1024) return { success: false, error: 'Archivo muy grande (máx. 10 MB).' };
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
    return { success: false, error: 'Solo imágenes (PNG, JPG, WEBP).' };
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: pedido } = await supabase
      .from('pedidos')
      .select('id, comprobante_url')
      .eq('id', pedidoId)
      .single();

    if (!pedido) return { success: false, error: 'Pedido no encontrado.' };
    if (pedido.comprobante_url) return { success: true, data: { url: pedido.comprobante_url } };

    const service = createSupabaseServiceClient();
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `comprobantes/${pedidoId}.${ext}`;

    const { error: uploadError } = await service.storage
      .from('product-images')
      .upload(path, file, { upsert: true });

    if (uploadError) return { success: false, error: `Error al subir: ${uploadError.message}` };

    const { data: { publicUrl } } = service.storage.from('product-images').getPublicUrl(path);

    const { error: dbError } = await supabase
      .from('pedidos')
      .update({ comprobante_url: publicUrl })
      .eq('id', pedidoId);

    if (dbError) return { success: false, error: dbError.message };

    return { success: true, data: { url: publicUrl } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado.' };
  }
}
