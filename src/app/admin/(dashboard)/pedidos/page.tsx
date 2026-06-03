import { getPedidos } from '@/actions/pedidos';
import { getProductosPublicos } from '@/lib/data';
import PedidosClient from './PedidosClient';

export default async function PedidosPage() {
  const [pedidos, productos] = await Promise.all([
    getPedidos(),
    getProductosPublicos(),
  ]);
  return <PedidosClient initialPedidos={pedidos} productos={productos} />;
}
