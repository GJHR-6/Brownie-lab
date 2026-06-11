import { getPedidos } from '@/actions/pedidos';
import { getProductosPublicos } from '@/lib/data';
import PedidosView from './PedidosView';

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const [paginado, productos] = await Promise.all([
    getPedidos(page),
    getProductosPublicos(),
  ]);

  return (
    <PedidosView
      initialPedidos={paginado.pedidos}
      productos={productos}
      total={paginado.total}
      page={paginado.page}
      pageSize={paginado.pageSize}
    />
  );
}
