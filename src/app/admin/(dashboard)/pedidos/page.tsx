import { getPedidos } from '@/actions/pedidos';
import { getProductosPublicos } from '@/lib/data';
import KanbanClient from './KanbanClient';

export default async function PedidosPage() {
  const [pedidos, productos] = await Promise.all([
    getPedidos(),
    getProductosPublicos(),
  ]);
  return <KanbanClient initialPedidos={pedidos} productos={productos} />;
}
