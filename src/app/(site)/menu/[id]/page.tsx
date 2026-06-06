import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductoPublicoById, getProductosSimilares } from "@/lib/data";
import ProductoDetailClient from "./ProductoDetailClient";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const producto = await getProductoPublicoById(id);
  if (!producto) return { title: "Producto no encontrado" };
  return {
    title: producto.nombre,
    description: producto.descripcion ?? `${producto.nombre} — Brownie Lab`,
    openGraph: {
      title: `${producto.nombre} | Brownie Lab`,
      description: producto.descripcion ?? "",
      images: producto.imagen_url ? [{ url: producto.imagen_url, width: 800, height: 600 }] : [],
    },
  };
}

export default async function ProductoPage({ params }: Props) {
  const { id } = await params;
  const [producto, similares] = await Promise.all([
    getProductoPublicoById(id),
    getProductoPublicoById(id).then((p) =>
      p ? getProductosSimilares(p.categoria, id) : []
    ),
  ]);
  if (!producto) notFound();
  return <ProductoDetailClient producto={producto} similares={similares} />;
}
