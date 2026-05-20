import { getPedidos } from '@/actions/pedidos';
import KanbanClient from './KanbanClient';

export default async function PedidosPage() {
  const pedidos = await getPedidos();
  return <KanbanClient initialPedidos={pedidos} />;
}
