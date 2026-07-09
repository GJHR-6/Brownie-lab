import type { Metadata } from "next";
import {
  getCajasPublicas,
  getProductosPublicos,
  getPersonalizaVariantes,
  getToppingsDinamicos,
  getRellenosDinamicos,
} from "@/lib/data";
import CajasClient from "./CajasClient";

export const metadata: Metadata = {
  title: "Arma tu caja",
  description: "Elige el tamaño de tu caja y llénala con postres del menú o personalizados. Entre más grande la caja, más ahorras.",
  openGraph: {
    title: "Arma tu caja — Brownie Lab",
    description: "Cajas de postres a tu medida: combina del menú o personaliza cada uno, y ahorra.",
  },
};

export default async function CajasPage() {
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

  return (
    <CajasClient
      cajas={cajas}
      productos={productos}
      toppings={toppings}
      rellenos={rellenos}
      brownies={brownies}
      galletas={galletas}
    />
  );
}
