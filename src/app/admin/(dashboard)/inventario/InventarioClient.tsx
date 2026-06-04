'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { toggleDisponible } from '@/actions/productos';
import type { Producto, Categoria } from '@/types/database';
import ToggleSwitch from '@/components/admin/ToggleSwitch';

const T = {
  th: { textAlign: 'left' as const, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
  td: { padding: '14px 22px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
  btnPrimary: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer' as const, background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s' },
};

interface InventarioClientProps {
  initialProducts: Producto[];
  categorias: Categoria[];
}

export default function InventarioClient({ initialProducts, categorias: _categorias }: InventarioClientProps) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => { startTransition(() => { router.refresh(); }); }, [router]);

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    await toggleDisponible(id, !current);
    setTogglingId(null);
    refresh();
  }

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">
      {/* Page head */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Inventario</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            {initialProducts.length} {initialProducts.length === 1 ? 'producto' : 'productos'}
            {isPending && <span style={{ marginLeft: 8, color: 'var(--orange-ink)' }}>Actualizando…</span>}
          </p>
        </div>
        <Link href="/admin/inventario/nuevo" style={{ ...T.btnPrimary, textDecoration: 'none' }}>
          <Plus style={{ width: 17, height: 17 }} />
          Nuevo producto
        </Link>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={T.th}>Producto</th>
                <th style={T.th}>Categoría</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Precio</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Stock</th>
                <th style={{ ...T.th, textAlign: 'center' }}>Disponible</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialProducts.map((p) => (
                <tr key={p.id}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                  style={{ transition: 'background .12s' }}>

                  {/* Product cell */}
                  <td style={T.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 11, flexShrink: 0, overflow: 'hidden', background: 'var(--cream)', display: 'grid', placeItems: 'center', color: 'var(--orange-ink)' }}>
                        {p.imagen_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imagen_url} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 20 }}>{p.emoji ?? '🍫'}</span>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                        {p.descripcion && (
                          <p style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'ui-monospace,monospace', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{p.descripcion}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td style={T.td}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 'var(--r-pill)', background: 'var(--cream-200)', color: 'var(--orange-ink)' }}>
                      {p.categoria}
                    </span>
                  </td>

                  {/* Price */}
                  <td style={{ ...T.td, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange-ink)' }}>
                      L. {p.precio.toFixed(2)}
                    </span>
                  </td>

                  {/* Stock */}
                  <td style={{ ...T.td, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: p.stock === 0 ? 'var(--berry)' : p.stock <= 5 ? '#b14a12' : 'var(--ink)' }}>
                      {p.stock}
                    </span>
                    {p.stock <= 5 && p.stock > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--r-pill)', background: '#fbe3d0', color: '#b14a12' }}>bajo</span>
                    )}
                  </td>

                  {/* Toggle disponible */}
                  <td style={{ ...T.td, textAlign: 'center' }}>
                    <ToggleSwitch checked={p.disponible} onChange={() => handleToggle(p.id, p.disponible)} disabled={togglingId === p.id} />
                  </td>

                  {/* Actions */}
                  <td style={{ ...T.td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <Link href={`/admin/inventario/${p.id}`}
                        style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', textDecoration: 'none', transition: '.14s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--orange-ink)'; e.currentTarget.style.borderColor = 'var(--orange)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}>
                        <Pencil style={{ width: 15, height: 15 }} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {initialProducts.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
                    No hay productos aún. Agrega el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
