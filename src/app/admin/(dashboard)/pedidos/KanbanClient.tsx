'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtimePedidos } from '@/hooks/useRealtimePedidos';
import { Bell } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { actualizarEstadoPedido } from '@/actions/pedidos';
import PedidoCard from './PedidoCard';
import CrearPedidoModal from './CrearPedidoModal';
import { useRouter } from 'next/navigation';
import { Plus, Download, Printer, Search, X, CheckSquare, Square, Loader2, MessageCircle } from 'lucide-react';
import type { ClienteDatos, PedidoItem } from '@/types/database';
import { marcarPedidosCompletados } from '@/actions/pedidos';
import { abrirWhatsAppPedido } from '@/lib/whatsappPedido';
import { useConfirm } from '@/components/admin/ConfirmProvider';
import type { Pedido, EstadoPedido, Producto } from '@/types/database';

interface Columna { estado: EstadoPedido; label: string; accent: string; chip: string; dot: string }

const COLUMNAS: Columna[] = [
  { estado: 'pendiente',   label: 'Pendiente',   accent: 'var(--amber)',    chip: '#fbeccb', dot: '#9a6a12' },
  { estado: 'preparacion', label: 'Preparación', accent: '#3b82f6',        chip: '#dbeafe', dot: '#1d5fb8' },
  { estado: 'listo',       label: 'Listo',       accent: 'var(--green)',   chip: '#d8f0e2', dot: '#157a4d' },
  { estado: 'completado',  label: 'Completado',  accent: 'var(--choco-700)', chip: '#e4ded3', dot: '#6b5743' },
];

function agrupar(pedidos: Pedido[]): Record<EstadoPedido, Pedido[]> {
  const base: Record<EstadoPedido, Pedido[]> = { pendiente: [], preparacion: [], listo: [], completado: [], cancelado: [] };
  for (const p of pedidos) { if (p.estado in base) base[p.estado].push(p); }
  return base;
}

function printPedido(pedido: Pedido) {
  const cd = pedido.cliente_datos as ClienteDatos;
  const items = pedido.items as PedidoItem[] | null;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pedido #${pedido.id.slice(0,8)}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;padding:16px;max-width:320px;font-size:12px}
  h1{text-align:center;font-size:15px;margin-bottom:2px}.center{text-align:center}.divider{border-top:1px dashed #000;margin:8px 0}
  .row{display:flex;justify-content:space-between;margin:3px 0}.total{font-weight:bold;font-size:14px}.label{color:#666;font-size:10px;text-transform:uppercase}
  </style></head><body>
  <h1>🍪 Brownie Lab</h1><p class="center label">Ticket de pedido</p>
  <div class="divider"></div>
  <p class="label">Cliente</p><p>${cd.nombre}</p><p>${cd.telefono}</p>${cd.notas ? `<p style="color:#555">${cd.notas}</p>` : ''}
  <div class="divider"></div>
  ${items && items.length > 0 ? items.map(i => `<div class="row"><span>${i.cantidad}× ${i.nombre}</span><span>L.${Number(i.subtotal).toFixed(2)}</span></div>`).join('') : '<p>Sin detalle de productos</p>'}
  <div class="divider"></div>
  <div class="row total"><span>TOTAL</span><span>L.${Number(pedido.total).toFixed(2)}</span></div>
  <div class="divider"></div>
  <p class="center label">${new Date(pedido.created_at).toLocaleString('es-HN')}</p>
  <p class="center label">#${pedido.id.slice(0,8).toUpperCase()}</p>
  <script>window.print();setTimeout(()=>window.close(),800);</script>
  </body></html>`;
  const win = window.open('', '_blank', 'width=420,height=620');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

export default function KanbanClient({ initialPedidos, productos, viewSwitcher, footer }: { initialPedidos: Pedido[]; productos: Producto[]; viewSwitcher?: React.ReactNode; footer?: React.ReactNode }) {
  const router = useRouter();
  const confirmar = useConfirm();
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [columns, setColumns] = useState<Record<EstadoPedido, Pedido[]>>(() => agrupar(initialPedidos));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nuevosCount, setNuevosCount] = useState(0);

  // Sincroniza con datos nuevos del servidor tras router.refresh()
  // (ajuste de estado durante render — patrón recomendado por React, sin effect)
  const [prevInitial, setPrevInitial] = useState(initialPedidos);
  if (prevInitial !== initialPedidos) {
    setPrevInitial(initialPedidos);
    setColumns(agrupar(initialPedidos));
    setNuevosCount(0);
  }

  const refresh = useCallback(() => {
    router.refresh();
    setNuevosCount(0);
  }, [router]);

  // Auto-refresh con debounce: agrupa ráfagas de eventos en un solo refresh
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => { router.refresh(); }, 1200);
  }, [router]);

  useEffect(() => () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); }, []);

  useRealtimePedidos(useCallback((tipo) => {
    if (tipo === 'insert') setNuevosCount(n => n + 1);
    scheduleRefresh(); // INSERTs y UPDATEs (cambios desde otro dispositivo)
  }, [scheduleRefresh]));

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    const srcCol = source.droppableId as EstadoPedido;
    const destCol = destination.droppableId as EstadoPedido;
    const snapshot = { ...columns, [srcCol]: [...columns[srcCol]], [destCol]: [...columns[destCol]] };
    const pedido = columns[srcCol].find(p => p.id === draggableId);
    if (!pedido) return;
    setColumns(prev => {
      const src = prev[srcCol].filter(p => p.id !== draggableId);
      const dest = [...prev[destCol]];
      dest.splice(destination.index, 0, { ...pedido, estado: destCol });
      return { ...prev, [srcCol]: src, [destCol]: dest };
    });
    setErrorMsg(null);
    const res = await actualizarEstadoPedido(draggableId, destCol);
    if (!res.success) { setColumns(snapshot); setErrorMsg(`Error al actualizar pedido: ${res.error}`); }
  }, [columns]);

  const total = initialPedidos.length;
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleCancel = useCallback(async (pedidoId: string) => {
    if (!(await confirmar({ titulo: 'Cancelar pedido', mensaje: 'El pedido quedará marcado como cancelado y desaparecerá del tablero.', confirmLabel: 'Cancelar pedido', cancelLabel: 'Volver', peligro: true }))) return;
    const srcCol = (Object.keys(columns) as EstadoPedido[]).find(k => columns[k].some(p => p.id === pedidoId));
    if (!srcCol) return;
    setColumns(prev => ({ ...prev, [srcCol]: prev[srcCol].filter(p => p.id !== pedidoId) }));
    setErrorMsg(null);
    const res = await actualizarEstadoPedido(pedidoId, 'cancelado');
    if (!res.success) { setErrorMsg(`Error al cancelar: ${res.error}`); router.refresh(); }
  }, [columns, router, confirmar]);

  async function handleBulkComplete() {
    if (!selectedIds.size) return;
    if (!(await confirmar({ titulo: 'Completar pedidos', mensaje: `${selectedIds.size} pedido(s) se marcarán como completados y se descontará stock.`, confirmLabel: 'Completar' }))) return;
    setBulkLoading(true);
    await marcarPedidosCompletados([...selectedIds]);
    setSelectedIds(new Set()); setBulkLoading(false); router.refresh();
  }

  const searchResults = search.trim()
    ? initialPedidos.filter(p => { const cd = p.cliente_datos as ClienteDatos; const q = search.toLowerCase(); return cd.nombre.toLowerCase().includes(q) || cd.telefono.includes(q); })
    : [];

  const CANCELADO_COL = { label: 'Cancelado', chip: '#fce8ea', dot: '#9e3b46' };
  const chipStyle = (col: Columna | typeof CANCELADO_COL) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 'var(--r-pill)', background: col.chip, color: col.dot });

  return (
    <div className="px-6 md:px-10 py-8 pb-16" style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1500 }}>

      {/* Realtime banner */}
      {nuevosCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: 'var(--choco-900)', color: 'var(--on-dark)', borderRadius: 'var(--r-lg)',
          padding: '12px 18px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell style={{ width: 17, height: 17, color: 'var(--amber)', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {nuevosCount === 1 ? '1 nuevo pedido recibido' : `${nuevosCount} nuevos pedidos recibidos`} — actualizando…
            </span>
          </div>
          <button
            onClick={refresh}
            style={{ fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 'var(--r-pill)', background: 'var(--orange)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Actualizar
          </button>
        </div>
      )}

      {/* Page head + toolbar */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Pedidos</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            {total} {total === 1 ? 'pedido' : 'pedidos'} · Arrastra para cambiar estado
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {viewSwitcher}
          {/* Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search style={{ position: 'absolute', left: 14, width: 17, height: 17, color: 'var(--ink-soft)', pointerEvents: 'none' }} />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setSelectedIds(new Set()); }}
              placeholder="Buscar cliente…"
              style={{ padding: '10px 16px 10px 40px', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', background: 'var(--paper-card)', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', width: 220, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--hairline)'} />
            {search && (
              <button onClick={() => { setSearch(''); setSelectedIds(new Set()); }}
                style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', display: 'grid', placeItems: 'center' }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
          <a href="/api/admin/export/pedidos" download
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer', background: 'var(--paper-card)', color: 'var(--ink)', transition: '.16s', textDecoration: 'none' }}>
            <Download style={{ width: 16, height: 16 }} />CSV
          </a>
          <button onClick={() => setIsCrearOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s' }}>
            <Plus style={{ width: 17, height: 17 }} />Nuevo pedido
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div style={{ marginBottom: 16, background: 'var(--cream)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{selectedIds.size} seleccionado(s)</span>
          <button onClick={handleBulkComplete} disabled={bulkLoading}
            style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {bulkLoading ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : '✓'}
            Marcar como completado
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', display: 'grid', placeItems: 'center' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
      )}

      {/* Error toast */}
      {errorMsg && (
        <div style={{ marginBottom: 16, background: '#fdf0f0', border: '1px solid #e6c4c8', borderLeft: '4px solid var(--berry)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 14, color: 'var(--berry)' }}>
          {errorMsg}
        </div>
      )}

      {/* Search results */}
      {search.trim() && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 12 }}>{searchResults.length} resultado(s) para &ldquo;{search}&rdquo;</p>
          {searchResults.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, textAlign: 'center', padding: '48px 0' }}>Sin resultados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.map(p => {
                const cd = p.cliente_datos as ClienteDatos;
                const checked = selectedIds.has(p.id);
                const col = COLUMNAS.find(c => c.estado === p.estado) ?? CANCELADO_COL;
                return (
                  <div key={p.id} onClick={() => toggleSelect(p.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 'var(--r-md)', border: `1.5px solid ${checked ? 'var(--orange)' : 'var(--hairline)'}`, background: checked ? 'var(--cream)' : 'var(--paper-card)', cursor: 'pointer', transition: '.12s' }}>
                    {checked ? <CheckSquare style={{ width: 16, height: 16, color: 'var(--orange-ink)', flexShrink: 0 }} /> : <Square style={{ width: 16, height: 16, color: 'var(--ink-soft)', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', margin: 0 }}>{cd.nombre}</p>
                      <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>{cd.telefono} · {new Date(p.created_at).toLocaleDateString('es-HN')}</p>
                    </div>
                    <span style={chipStyle(col)}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                      {col.label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--orange-ink)' }}>L.{Number(p.total).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Crear modal */}
      {isCrearOpen && (
        <CrearPedidoModal productos={productos} onSuccess={() => { setIsCrearOpen(false); router.refresh(); }} onClose={() => setIsCrearOpen(false)} />
      )}

      {/* Kanban board */}
      {!search.trim() && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" style={{ flex: 1, minHeight: 0 }}>
            {COLUMNAS.map((col) => (
              <div key={col.estado}
                style={{ display: 'flex', flexDirection: 'column', background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', borderTop: `3px solid ${col.accent}`, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                {/* Column header */}
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--hairline)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.accent, flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{col.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, background: 'var(--cream-200)', color: 'var(--ink-soft)', padding: '2px 8px', borderRadius: 'var(--r-pill)' }}>
                    {columns[col.estado].length}
                  </span>
                </div>
                <Droppable droppableId={col.estado}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', minHeight: 120, background: snapshot.isDraggingOver ? 'var(--cream)' : '', transition: 'background .15s' }}>
                      {columns[col.estado].map((pedido, index) => (
                        <Draggable key={pedido.id} draggableId={pedido.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              className="group relative"
                              style={{ transition: snapshot.isDragging ? 'none' : 'box-shadow .15s', transform: snapshot.isDragging ? 'rotate(1deg)' : undefined, ...provided.draggableProps.style }}>
                              <PedidoCard pedido={pedido} onCancel={() => handleCancel(pedido.id)} />
                              {/* Action buttons on hover */}
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ pointerEvents: 'none' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.pointerEvents = 'auto'; }}>
                                <button onMouseDown={e => e.stopPropagation()} onClick={() => abrirWhatsAppPedido(pedido)}
                                  title="Avisar al cliente por WhatsApp (mensaje según estado)"
                                  style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: '#1aad56', cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                                  <MessageCircle style={{ width: 13, height: 13 }} />
                                </button>
                                <button onMouseDown={e => e.stopPropagation()} onClick={() => printPedido(pedido)}
                                  title="Imprimir ticket"
                                  style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                                  <Printer style={{ width: 13, height: 13 }} />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {columns[col.estado].length === 0 && (
                        <p style={{ fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center', padding: '20px 0' }}>Sin pedidos</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Paginación */}
      {footer}
    </div>
  );
}
