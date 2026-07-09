export type EstadoPedido = 'pendiente' | 'preparacion' | 'listo' | 'completado' | 'cancelado';
export type EstadoPago = 'pendiente' | 'anticipo_recibido' | 'pagado';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  descripcion_larga: string | null;
  precio: number;
  costo: number;               // costo de producción por unidad (0 = sin definir)
  imagen_url: string | null;
  imagenes: string[];
  stock: number;
  stock_alerta: number;
  disponible: boolean;
  categoria_id: string;
  categoria: string;           // slug derivado del join con categorias
  emoji: string | null;
  tiempo_preparacion: string | null;
  alergenos: string[];
  etiquetas: string[];
  sku: string | null;
  destacado_capricho: boolean;
  disponible_personaliza: boolean;
  disponible_desde?: string | null;
  disponible_hasta?: string | null;
  ingredientes?: string[];
  created_at: string;
  updated_at: string;
}

export interface EnvioDatos {
  sede: string;            // sede de despacho asignada
  distancia_km: number;    // 0 si fue selección manual de sede (sin GPS)
  costo: number;
  gratis: boolean;
  zona_id?: string;        // id de delivery_zones cuando envio_modo === 'zonas'
  zona_nombre?: string;
}

export type OrigenPedido = 'pagina' | 'instagram' | 'facebook' | 'whatsapp' | 'otro';

export interface ClienteDatos {
  nombre: string;
  telefono?: string;
  notas?: string;
  metodo_pago?: string;
  tipo_entrega?: 'pickup' | 'domicilio';
  direccion?: string;
  fecha_entrega?: string;
  hora_entrega?: string;
  envio?: EnvioDatos;
  origen?: OrigenPedido;
  sede_pickup?: string;     // sede elegida cuando tipo_entrega === 'pickup'
  zona_id?: string;         // id de delivery_zones elegida cuando envio_modo === 'zonas'
  gift_card_codigo?: string;
  gift_card_descuento?: number;
}

// Composición estructurada de items armados en el cliente (personalizados y
// cajas). Viaja junto al item del checkout para que el servidor recalcule el
// precio real; no se persiste en pedido_items.
export type ComposicionCustom = {
  tipo: 'custom';
  base: 'brownie' | 'galleta';
  varianteSlug: string;
  toppings: string[];
  relleno?: string | null;
};

export type ComposicionSlot =
  | { tipo: 'producto'; productoId: string }
  | ComposicionCustom;

export type ComposicionItem =
  | { tipo: 'caja'; cajaId: string; slots: ComposicionSlot[] }
  | ComposicionCustom;

export interface PedidoItem {
  producto_id: string | null;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  composicion?: ComposicionItem | null;
}

export interface Pedido {
  id: string;
  cliente_datos: ClienteDatos;
  items: PedidoItem[] | null;   // mapeado desde pedido_items
  total: number;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  comprobante_url?: string | null;
  telefono_cliente?: string | null;
  metodo_pago?: 'efectivo' | 'transferencia' | null;
  descuento?: number;
  costo_envio?: number;
  created_at: string;
  updated_at: string;
}

export type GastoCategoria = 'ingredientes' | 'empaque' | 'delivery' | 'servicios' | 'equipo' | 'marketing' | 'otros';

export interface Gasto {
  id: string;
  fecha: string;               // YYYY-MM-DD
  categoria: GastoCategoria;
  monto: number;
  nota: string | null;
  created_at: string;
  updated_at: string;
}

export interface Testimonio {
  id: string;
  autor: string;
  texto: string;
  estrellas: number;
  aprobado: boolean;
  created_at: string;
}

export interface Resena {
  id: string;
  producto_id: string;
  autor: string;
  texto: string;
  estrellas: number;
  aprobado: boolean;
  created_at: string;
}

export interface Promocion {
  id: string;
  codigo: string;
  descuento_porcentaje: number;
  usos_restantes: number;
  activa: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  mensaje: string;
  activo: boolean;
  orden: number;
  created_at: string;
}

export interface AdminUser {
  user_id: string;
  email: string;
  created_at: string;
}

export interface Configuracion {
  id: number;
  nombre: string;
  tagline: string;
  descripcion: string | null;
  whatsapp: string;
  correo: string;
  ubicacion: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  anticipacion_minima: string;
  horario_atencion: string;
  mensaje_bienvenida: string;
  logo_url: string | null;
  hero_imagen_url: string | null;
  nosotros_imagen_url: string | null;
  personalizador_imagen_url: string | null;
  banco_nombre: string;
  banco_titular: string;
  banco_numero: string;
  horas_entrega: string[];
  hora_corte: string;          // HH:MM 24h, hora Honduras
  envio_sedes: Array<{ nombre: string; lat: number; lng: number; tarifa_base: number }>;
  envio_por_km: number;
  envio_factor_ruta: number;
  envio_km_max: number;
  envio_gratis_monto: number;
  envio_modo: 'distancia' | 'zonas';
  updated_at: string;
}

export interface DeliveryZone {
  id: string;
  nombre: string;
  descripcion: string | null;
  tarifa: number;
  activa: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export type EstadoGiftCard = 'pendiente' | 'activa' | 'agotada' | 'cancelada';

export interface GiftCard {
  id: string;
  codigo: string;
  monto: number;
  saldo: number;
  estado: EstadoGiftCard;
  destinatario_nombre: string | null;
  destinatario_telefono: string | null;
  comprador_telefono: string;
  mensaje: string | null;
  created_at: string;
  redeemed_at: string | null;
}

export type EstadoCatering = 'nueva' | 'contactado' | 'cotizado' | 'cerrada';

export interface CateringSolicitud {
  id: string;
  tipo_evento: string;
  rango_personas: string;
  fecha_evento: string;
  sede_cercana: string | null;
  detalles: string | null;
  cliente_nombre: string;
  cliente_telefono: string;
  estado: EstadoCatering;
  created_at: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  created_at: string;
}

export interface Especial {
  id: string;
  nombre: string;
  descripcion: string;
  emoji: string;
  imagen_url: string | null;
  imagenes: string[];
  fecha_inicio: string;
  duracion_dias: number;
  activo: boolean;
  created_at: string;
}

export interface PersonalizaVariante {
  id: string;
  base: 'brownie' | 'galleta';
  slug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string;
  proximamente: boolean;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface Caja {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  tamano: number;
  descuento_pct: number;
  imagen_url: string;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface Ingrediente {
  id: string;
  nombre: string;
  descripcion_paquete: string | null;
  unidad: string;
  tamano_paquete: number;
  costo_paquete: number;
  costo_por_unidad: number | null;
  cantidad_por_bandeja: number | null;
  costo_por_bandeja: number | null;
  stock_paquetes: number;
  precio_extra: number;
  es_topping: boolean;
  es_relleno: boolean;
  activo: boolean;
  notas: string | null;
  imagen_url: string | null;
  created_at: string;
  updated_at: string;
}
