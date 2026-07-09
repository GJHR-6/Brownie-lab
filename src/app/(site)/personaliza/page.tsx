import type { Metadata } from "next";
import { getToppingsDinamicos, getPersonalizaVariantes, getRellenosDinamicos } from "@/lib/data";
import PersonalizaClient from "./PersonalizaClient";

export const metadata: Metadata = {
  title: "Personaliza tu postre",
  description: "Elige tu base, agrega los toppings que quieras y míralo cobrar forma. Brownie o galleta, hecho a tu medida.",
  openGraph: {
    title: "Personaliza tu postre — Brownie Lab",
    description: "Elige tu base, agrega los toppings que quieras y míralo cobrar forma.",
  },
};

export default async function PersonalizaPage() {
  const [toppingsDB, variantesDB, rellenosDB] = await Promise.all([
    getToppingsDinamicos(),
    getPersonalizaVariantes(),
    getRellenosDinamicos(),
  ]);

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
    .filter(v => v.base === 'brownie')
    .map(v => ({ id: v.slug, name: v.nombre, desc: v.descripcion, price: v.precio, img: v.imagen_url, proximamente: v.proximamente }));

  const galletas = variantesDB
    .filter(v => v.base === 'galleta')
    .map(v => ({ id: v.slug, name: v.nombre, desc: v.descripcion, price: v.precio, img: v.imagen_url, proximamente: v.proximamente }));

  return <PersonalizaClient toppings={toppings} rellenos={rellenos} brownies={brownies} galletas={galletas} />;
}
