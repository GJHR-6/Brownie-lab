'use client';

import { useSyncExternalStore } from 'react';
import { List, Columns3 } from 'lucide-react';
import PedidosClient from './PedidosClient';
import KanbanClient from './KanbanClient';
import PedidosPagination from './PedidosPagination';
import type { Pedido, Producto } from '@/types/database';

type Vista = 'tabla' | 'kanban';
const STORAGE_KEY = 'admin-pedidos-vista';
const CHANGE_EVENT = 'admin-pedidos-vista-change';

// localStorage como external store — sin mismatch de hidratación (server siempre 'tabla')
function subscribe(cb: () => void) {
  window.addEventListener('storage', cb);
  window.addEventListener(CHANGE_EVENT, cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener(CHANGE_EVENT, cb);
  };
}
const getSnapshot = (): Vista => (localStorage.getItem(STORAGE_KEY) === 'kanban' ? 'kanban' : 'tabla');
const getServerSnapshot = (): Vista => 'tabla';

function cambiarVista(v: Vista) {
  localStorage.setItem(STORAGE_KEY, v);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

interface PedidosViewProps {
  initialPedidos: Pedido[];
  productos: Producto[];
  total: number;
  page: number;
  pageSize: number;
}

export default function PedidosView({ initialPedidos, productos, total, page, pageSize }: PedidosViewProps) {
  const vista = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const switcher = (
    <div role="group" aria-label="Cambiar vista de pedidos"
      style={{ display: 'inline-flex', background: 'var(--cream-200)', borderRadius: 'var(--r-pill)', padding: 4, gap: 2, flexShrink: 0 }}>
      {([
        { key: 'tabla' as Vista, label: 'Tabla', Icon: List },
        { key: 'kanban' as Vista, label: 'Tablero', Icon: Columns3 },
      ]).map(({ key, label, Icon }) => {
        const active = vista === key;
        return (
          <button
            key={key}
            onClick={() => cambiarVista(key)}
            aria-pressed={active}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, padding: '7px 14px',
              borderRadius: 'var(--r-pill)', border: 'none', cursor: 'pointer',
              background: active ? 'var(--paper-card)' : 'none',
              color: active ? 'var(--ink)' : 'var(--ink-soft)',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              transition: '.15s',
            }}
          >
            <Icon style={{ width: 15, height: 15 }} />
            {label}
          </button>
        );
      })}
    </div>
  );

  const pagination = <PedidosPagination total={total} page={page} pageSize={pageSize} />;

  return vista === 'kanban'
    ? <KanbanClient initialPedidos={initialPedidos} productos={productos} viewSwitcher={switcher} footer={pagination} />
    : <PedidosClient initialPedidos={initialPedidos} productos={productos} viewSwitcher={switcher} footer={pagination} />;
}
