import { getProductos } from '@/actions/productos';
import CostosClient from './CostosClient';

export default async function CostosPage() {
  const productos = await getProductos();
  return <CostosClient initialProductos={productos} />;
}
