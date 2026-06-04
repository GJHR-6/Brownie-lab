import { getCategorias } from '@/actions/categorias';
import { getIngredientes } from '@/actions/ingredientes';
import ProductoPageClient from '../[id]/ProductoPageClient';

export default async function NuevoProductoPage() {
  const [categorias, ingredientes] = await Promise.all([getCategorias(), getIngredientes()]);
  return <ProductoPageClient categorias={categorias} ingredientes={ingredientes} />;
}
