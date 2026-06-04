import { notFound } from 'next/navigation';
import { getProductoById } from '@/actions/productos';
import { getCategorias } from '@/actions/categorias';
import { getIngredientes } from '@/actions/ingredientes';
import ProductoPageClient from './ProductoPageClient';

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [producto, categorias, ingredientes] = await Promise.all([
    getProductoById(id),
    getCategorias(),
    getIngredientes(),
  ]);
  if (!producto) notFound();
  return <ProductoPageClient producto={producto} categorias={categorias} ingredientes={ingredientes} />;
}
