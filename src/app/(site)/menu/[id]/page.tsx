import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductoPublicoById, getProductosSimilares, getProductoIdsEstaticos } from "@/lib/data";
import { getResenasProducto } from "@/actions/resenas";
import ProductoDetailClient from "./ProductoDetailClient";

// Revalida cada 10 minutos en background; la página estática se sirve instantáneamente
export const revalidate = 600;

// Pre-genera HTML estático para todos los productos disponibles en build time
export async function generateStaticParams() {
  const ids = await getProductoIdsEstaticos();
  return ids.map((id) => ({ id }));
}

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // cache() deduplicates: si generateMetadata y la página llaman a esta función,
  // solo se hace una sola query a Supabase
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
  // cache() garantiza que aunque generateMetadata ya llamó getProductoPublicoById(id),
  // esta segunda llamada no genera una query extra a la DB
  const producto = await getProductoPublicoById(id);
  if (!producto) notFound();

  const similares = await getProductosSimilares(producto.categoria, id);
  const resenas = await getResenasProducto(producto.id);

  return <ProductoDetailClient producto={producto} similares={similares} resenas={resenas} />;
}
