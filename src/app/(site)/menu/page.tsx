import type { Metadata } from "next";
import { getProductosPublicos, getCategoriasPublicas, getEspecialesActivos, getConfiguracion } from "@/lib/data";
import { storeConfig } from "@/config/store";
import MenuClient from "./MenuClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Menú",
  description: "Brownies y galletas artesanales horneados a mano. Elige tu favorito y pide con 24 h de anticipación.",
  openGraph: {
    title: "Menú — Brownie Lab",
    description: "Brownies y galletas artesanales horneados a mano en Honduras.",
  },
};

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [productos, categorias, especiales, config] = await Promise.all([
    getProductosPublicos(),
    getCategoriasPublicas(),
    getEspecialesActivos(),
    getConfiguracion(),
  ]);

  const hoy = new Date();
  const activos = especiales.filter(e => {
    const fin = new Date(e.fecha_inicio);
    fin.setDate(fin.getDate() + e.duracion_dias);
    return fin > hoy;
  });

  const whatsapp = config?.whatsapp || storeConfig.whatsapp;

  return <MenuClient productos={productos} categorias={categorias} especiales={activos} whatsapp={whatsapp} initialSearch={q ?? ""} />;
}
