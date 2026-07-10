// Server-only: arma los datos que necesita el armador de cajas.
// Compartido por /cajas (página standalone) y /cart (etapa "cajas" del flujo).

import {
  getCajasPublicas,
  getProductosPublicos,
  getPersonalizaVariantes,
  getToppingsDinamicos,
  getRellenosDinamicos,
} from "@/lib/data";
import type { CajaBuilderData } from "@/components/caja/types";

export async function getCajaBuilderData(): Promise<CajaBuilderData> {
  const [cajasDB, productosDB, variantesDB, toppingsDB, rellenosDB] = await Promise.all([
    getCajasPublicas(),
    getProductosPublicos(),
    getPersonalizaVariantes(),
    getToppingsDinamicos(),
    getRellenosDinamicos(),
  ]);

  const cajas = cajasDB.map(c => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    tamano: c.tamano,
    descuentoPct: c.descuento_pct,
    imagenUrl: c.imagen_url || null,
  }));

  const productos = productosDB
    .filter(p => p.stock > 0)
    .map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      emoji: p.emoji,
      imagen_url: p.imagen_url,
    }));

  const toppings = toppingsDB.map(t => ({
    name: t.nombre,
    price: t.precio_extra,
    imagen_url: t.imagen_url,
  }));

  const rellenos = rellenosDB.map(r => ({
    name: r.nombre,
    price: r.precio_extra,
    imagen_url: r.imagen_url,
  }));

  const brownies = variantesDB
    .filter(v => v.base === 'brownie' && !v.proximamente)
    .map(v => ({ id: v.slug, name: v.nombre, desc: v.descripcion, price: v.precio }));

  const galletas = variantesDB
    .filter(v => v.base === 'galleta' && !v.proximamente)
    .map(v => ({ id: v.slug, name: v.nombre, desc: v.descripcion, price: v.precio }));

  return { cajas, productos, toppings, rellenos, brownies, galletas };
}
