'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PedidosPagination({ total, page, pageSize }: { total: number; page: number; pageSize: number }) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) return null;

  const desde = (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);

  function goTo(p: number) {
    router.push(p === 1 ? '/admin/pedidos' : `/admin/pedidos?page=${p}`);
  }

  const btn = (disabled: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13,
    padding: '8px 14px', borderRadius: 'var(--r-pill)',
    border: '1.5px solid var(--hairline)',
    background: 'var(--paper-card)', color: disabled ? 'var(--ink-soft)' : 'var(--ink)',
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1, transition: '.15s',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 500 }}>
        Mostrando {desde}–{hasta} de {total} pedidos
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => goTo(page - 1)} disabled={page <= 1} style={btn(page <= 1)} aria-label="Página anterior">
          <ChevronLeft style={{ width: 15, height: 15 }} />
          Anterior
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', padding: '0 6px', fontFamily: 'ui-monospace,monospace' }}>
          {page} / {totalPages}
        </span>
        <button onClick={() => goTo(page + 1)} disabled={page >= totalPages} style={btn(page >= totalPages)} aria-label="Página siguiente">
          Siguiente
          <ChevronRight style={{ width: 15, height: 15 }} />
        </button>
      </div>
    </div>
  );
}
