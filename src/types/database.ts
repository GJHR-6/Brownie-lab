export type EstadoPedido = 'pendiente' | 'preparacion' | 'listo' | 'completado';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  stock: number;
  disponible: boolean;
  categoria: string;
  emoji: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClienteDatos {
  nombre: string;
  telefono: string;
  notas?: string;
}

export interface PedidoItem {
  producto_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  cliente_datos: ClienteDatos;
  items: PedidoItem[] | null;
  total: number;
  estado: EstadoPedido;
  created_at: string;
  updated_at: string;
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
  instagram: string;
  facebook: string;
  tiktok: string;
  updated_at: string;
}

export interface Especial {
  id: string;
  nombre: string;
  descripcion: string;
  emoji: string;
  fecha_inicio: string;
  duracion_dias: number;
  activo: boolean;
  created_at: string;
}
