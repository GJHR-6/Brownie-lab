import { getProductos } from '@/actions/productos';
import { getCategorias } from '@/actions/categorias';
import InventarioClient from './InventarioClient';

export default async function InventarioPage() {
  const [productos, categorias] = await Promise.all([getProductos(), getCategorias()]);
  return <InventarioClient initialProducts={productos} categorias={categorias} />;
}
