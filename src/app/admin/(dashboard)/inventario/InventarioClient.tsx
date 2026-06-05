'use client';

import { useState, useCallback, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Search } from 'lucide-react';
import { toggleDisponible } from '@/actions/productos';
import type { Producto, Categoria } from '@/types/database';
import ToggleSwitch from '@/components/admin/ToggleSwitch';

const T = {
  th: { textAlign: 'left' as const, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
  td: { padding: '14px 22px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
  btnPrimary: { display: 'inline-flex' as const, alignItems: 'center' as const, gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer' as const, background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s' },
  select: { border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', padding: '8px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)', background: 'var(--paper-card)', outline: 'none', cursor: 'pointer', appearance: 'auto' as const },
};

type EstadoFiltro = 'todos' | 'activo' | 'inactivo' | 'agotado' | 'bajo';

interface InventarioClientProps {
  initialProducts: Producto[];
  categorias: Categoria[];
}

export default function InventarioClient({ initialProducts, categorias }: InventarioClientProps) {
  const router = useRouter();
  const [togglingId,      setTogglingId]      = useState<string | null>(null);
  const [isPending,       startTransition]     = useTransition();
  const [search,          setSearch]           = useState('');
  const [filterCategoria, setFilterCategoria]  = useState('');
  const [filterEstado,    setFilterEstado]     = useState<EstadoFiltro>('todos');

  const refresh = useCallback(() => { startTransition(() => { router.refresh(); }); }, [router]);

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    await toggleDisponible(id, !current);
    setTogglingId(null);
    refresh();
  }

  const filtered = useMemo(() => {
    return initialProducts.filter(p => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.nombre.toLowerCase().includes(q) && !(p.descripcion ?? '').toLowerCase().includes(q) && !(p.sku ?? '').toLowerCase().includes(q)) return false;
      }
      if (filterCategoria && p.categoria !== filterCategoria) return false;
      if (filterEstado === 'activo')   return p.disponible && p.stock > 0;
      if (filterEstado === 'inactivo') return !p.disponible;
      if (filterEstado === 'agotado')  return p.disponible && p.stock === 0;
      if (filterEstado === 'bajo')     return p.disponible && p.stock > 0 && p.stock <= (p.stock_alerta ?? 5);
      return true;
    });
  }, [initialProducts, search, filterCategoria, filterEstado]);

  const hasFilters = search.trim() || filterCategoria || filterEstado !== 'todos';

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">

      {/* Page head */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Inventario</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            {filtered.length !== initialProducts.length
              ? <>{filtered.length} de {initialProducts.length} productos</>
              : <>{initialProducts.length} {initialProducts.length === 1 ? 'producto' : 'productos'}</>}
            {isPending && <span style={{ marginLeft: 8, color: 'var(--orange-ink)' }}>Actualizando…</span>}
          </p>
        </div>
        <Link href="/admin/inventario/nuevo" style={{ ...T.btnPrimary, textDecoration: 'none' }}>
          <Plus style={{ width: 17, height: 17 }} />
          Nuevo producto
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
          <Search style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--ink-soft)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            style={{ width: '100%', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', padding: '8px 14px 8px 36px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink)', background: 'var(--paper-card)', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'var(--orange)'}
            onBlur={e => e.target.style.borderColor = 'var(--hairline)'}
          />
        </div>

        {/* Category */}
        <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} style={T.select}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
        </select>

        {/* Estado */}
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value as EstadoFiltro)} style={T.select}>
          <option value="todos">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="agotado">Agotado</option>
          <option value="bajo">Bajo stock</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterCategoria(''); setFilterEstado('todos'); }}
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
          >
            Limpiar filtros
          </button>
        )}
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
              {filtered.map((p) => (
                <tr key={p.id}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                  style={{ transition: 'background .12s' }}>

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
                        {p.sku && (
                          <p style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'ui-monospace,monospace', marginTop: 2 }}>{p.sku}</p>
                        )}
                        {!p.sku && p.descripcion && (
                          <p style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'ui-monospace,monospace', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{p.descripcion}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td style={T.td}>
                    <span style={{ display: 'inline-flex', fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 'var(--r-pill)', background: 'var(--cream-200)', color: 'var(--orange-ink)' }}>
                      {p.categoria}
                    </span>
                  </td>

                  <td style={{ ...T.td, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange-ink)' }}>
                      L. {p.precio.toFixed(2)}
                    </span>
                  </td>

                  <td style={{ ...T.td, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: p.stock === 0 ? 'var(--berry)' : p.stock <= (p.stock_alerta ?? 5) ? '#b14a12' : 'var(--ink)' }}>
                      {p.stock}
                    </span>
                    {p.stock > 0 && p.stock <= (p.stock_alerta ?? 5) && (
                      <span style={{ display: 'inline-flex', marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--r-pill)', background: '#fbe3d0', color: '#b14a12' }}>bajo</span>
                    )}
                  </td>

                  <td style={{ ...T.td, textAlign: 'center' }}>
                    <ToggleSwitch checked={p.disponible} onChange={() => handleToggle(p.id, p.disponible)} disabled={togglingId === p.id} />
                  </td>

                  <td style={{ ...T.td, textAlign: 'right' }}>
                    <Link href={`/admin/inventario/${p.id}`}
                      style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', textDecoration: 'none', transition: '.14s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--orange-ink)'; e.currentTarget.style.borderColor = 'var(--orange)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}>
                      <Pencil style={{ width: 15, height: 15 }} />
                    </Link>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)', borderBottom: 0 }}>
                    {hasFilters ? 'Sin resultados para este filtro.' : 'No hay productos aún. Agrega el primero.'}
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
