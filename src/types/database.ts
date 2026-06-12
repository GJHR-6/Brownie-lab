export type EstadoPedido = 'pendiente' | 'preparacion' | 'listo' | 'completado' | 'cancelado';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
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
}

export interface ClienteDatos {
  nombre: string;
  telefono: string;
  notas?: string;
  metodo_pago?: string;
  tipo_entrega?: 'pickup' | 'domicilio';
  direccion?: string;
  fecha_entrega?: string;
  hora_entrega?: string;
  envio?: EnvioDatos;
}

export interface PedidoItem {
  producto_id: string | null;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  cliente_datos: ClienteDatos;
  items: PedidoItem[] | null;   // mapeado desde pedido_items
  total: number;
  estado: EstadoPedido;
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
  envio_sedes: Array<{ nombre: string; lat: number; lng: number; tarifa_base: number }>;
  envio_por_km: number;
  envio_factor_ruta: number;
  envio_km_max: number;
  envio_gratis_monto: number;
  updated_at: string;
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
  activo: boolean;
  notas: string | null;
  imagen_url: string | null;
  created_at: string;
  updated_at: string;
}
