// Tipos compartidos del armador de cajas — usados por la página /cajas
// y por la etapa "cajas" del flujo de pedido (/cart).

export type MainBase = "brownie" | "galleta";

export interface CajaDef {
  id: string;
  nombre: string;
  descripcion: string;
  tamano: number;
  descuentoPct: number;
  imagenUrl: string | null;
}

export interface ProductoLite {
  id: string;
  nombre: string;
  precio: number;
  emoji: string | null;
  imagen_url: string | null;
}

export interface Variant {
  id: string;
  name: string;
  desc: string;
  price: number;
}

export interface ToppingDef {
  name: string;
  price: number;
  imagen_url?: string | null;
}

export type SlotContent =
  | { tipo: "producto"; productoId: string; nombre: string; precio: number; emoji: string | null; imagenUrl: string | null }
  | { tipo: "custom"; nombre: string; precio: number; emoji: string; base: MainBase; varianteSlug: string; toppings: string[]; relleno: string | null };

export interface CajaBuilderData {
  cajas: CajaDef[];
  productos: ProductoLite[];
  toppings: ToppingDef[];
  rellenos: ToppingDef[];
  brownies: Variant[];
  galletas: Variant[];
}

export const MAX_TOPPINGS = 2;
export const round2 = (n: number) => Math.round(n * 100) / 100;
