import { getPedidos } from '@/actions/pedidos';
import { getProductosPublicos, getToppingsDinamicos } from '@/lib/data';
import PedidosView from './PedidosView';

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const [paginado, productos, toppings] = await Promise.all([
    getPedidos(page),
    getProductosPublicos(),
    getToppingsDinamicos(),
  ]);

  return (
    <PedidosView
      initialPedidos={paginado.pedidos}
      productos={productos}
      toppings={toppings.map(t => ({ id: t.id, nombre: t.nombre, precio_extra: t.precio_extra }))}
      total={paginado.total}
      page={paginado.page}
      pageSize={paginado.pageSize}
    />
  );
}
