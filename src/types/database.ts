export type EstadoPedido = 'pendiente' | 'preparacion' | 'listo' | 'completado';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
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

export interface ClienteDatos {
  nombre: string;
  telefono: string;
  notas?: string;
  metodo_pago?: string;
  tipo_entrega?: 'pickup' | 'domicilio';
  direccion?: string;
  fecha_entrega?: string;
  hora_entrega?: string;
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
  items: PedidoItem[] | null;   // mapeado desde pedido_items
  total: number;
  estado: EstadoPedido;
  comprobante_url?: string | null;
  telefono_cliente?: string | null;
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
  envio_gratis_desde: string;
  anticipacion_minima: string;
  horario_atencion: string;
  aviso_barra_superior: string;
  mensaje_bienvenida: string;
  logo_url: string | null;
  hero_imagen_url: string | null;
  nosotros_imagen_url: string | null;
  personalizador_imagen_url: string | null;
  banco_nombre: string;
  banco_titular: string;
  banco_numero: string;
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
  fecha_inicio: string;
  duracion_dias: number;
  activo: boolean;
  created_at: string;
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
  created_at: string;
  updated_at: string;
}
