import type { Metadata } from "next";
import { getToppingsDinamicos } from "@/lib/data";
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
  const toppingsDB = await getToppingsDinamicos();
  const toppings = toppingsDB.map(t => ({ name: t.nombre, price: t.precio_extra, imagen_url: t.imagen_url }));
  return <PersonalizaClient toppings={toppings} />;
}
