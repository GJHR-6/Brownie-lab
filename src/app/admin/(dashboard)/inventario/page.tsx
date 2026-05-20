import { getProductos } from '@/actions/productos';
import InventarioClient from './InventarioClient';

export default async function InventarioPage() {
  const productos = await getProductos();
  return <InventarioClient initialProducts={productos} />;
}
