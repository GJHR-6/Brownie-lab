'use client';

import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { actualizarEstadoPedido } from '@/actions/pedidos';
import PedidoCard from './PedidoCard';
import CrearPedidoModal from './CrearPedidoModal';
import { useRouter } from 'next/navigation';
import { Plus, Download, Printer, Search, X, CheckSquare, Square, Loader2 } from 'lucide-react';
import type { ClienteDatos, PedidoItem } from '@/types/database';
import { marcarPedidosCompletados } from '@/actions/pedidos';
import type { Pedido, EstadoPedido, Producto } from '@/types/database';

// ── Config de columnas ─────────────────────────────────────────────────────────

interface Columna {
  estado: EstadoPedido;
  label: string;
  color: string;
  dot: string;
}

const COLUMNAS: Columna[] = [
  { estado: 'pendiente',   label: 'Pendiente',   color: 'border-t-amber-400',  dot: 'bg-amber-400'  },
  { estado: 'preparacion', label: 'Preparación', color: 'border-t-blue-400',   dot: 'bg-blue-400'   },
  { estado: 'listo',       label: 'Listo',       color: 'border-t-green-400',  dot: 'bg-green-400'  },
  { estado: 'completado',  label: 'Completado',  color: 'border-t-stone-400',  dot: 'bg-stone-400'  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function agrupar(pedidos: Pedido[]): Record<EstadoPedido, Pedido[]> {
  const base: Record<EstadoPedido, Pedido[]> = {
    pendiente: [], preparacion: [], listo: [], completado: [],
  };
  for (const p of pedidos) {
    base[p.estado].push(p);
  }
  return base;
}

// ── Componente ─────────────────────────────────────────────────────────────────

interface KanbanClientProps {
  initialPedidos: Pedido[];
  productos: Producto[];
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
  ${items && items.length > 0
    ? items.map(i => `<div class="row"><span>${i.cantidad}× ${i.nombre}</span><span>L.${Number(i.subtotal).toFixed(2)}</span></div>`).join('')
    : '<p>Sin detalle de productos</p>'}
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

export default function KanbanClient({ initialPedidos, productos }: KanbanClientProps) {
  const router = useRouter();
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [columns, setColumns] = useState<Record<EstadoPedido, Pedido[]>>(
    () => agrupar(initialPedidos)
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) return;

    const srcCol  = source.droppableId      as EstadoPedido;
    const destCol = destination.droppableId as EstadoPedido;

    // Snapshot para revertir si la Server Action falla
    const snapshot = { ...columns, [srcCol]: [...columns[srcCol]], [destCol]: [...columns[destCol]] };

    // Obtener pedido arrastrado
    const pedido = columns[srcCol].find((p) => p.id === draggableId);
    if (!pedido) return;

    // ── Actualización optimista ──────────────────────────────────────────────
    setColumns((prev) => {
      const src  = prev[srcCol].filter((p) => p.id !== draggableId);
      const dest = [...prev[destCol]];
      dest.splice(destination.index, 0, { ...pedido, estado: destCol });
      return { ...prev, [srcCol]: src, [destCol]: dest };
    });
    setErrorMsg(null);

    // ── Persistir en Supabase ────────────────────────────────────────────────
    const res = await actualizarEstadoPedido(draggableId, destCol);

    if (!res.success) {
      // Revertir al snapshot previo
      setColumns(snapshot);
      setErrorMsg(`Error al actualizar pedido: ${res.error}`);
    }
  }, [columns]);

  const total = initialPedidos.length;

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  async function handleBulkComplete() {
    if (!selectedIds.size) return;
    if (!confirm(`¿Marcar ${selectedIds.size} pedido(s) como completado?`)) return;
    setBulkLoading(true);
    await marcarPedidosCompletados([...selectedIds]);
    setSelectedIds(new Set());
    setBulkLoading(false);
    router.refresh();
  }

  const searchResults = search.trim()
    ? initialPedidos.filter(p => {
        const cd = p.cliente_datos as ClienteDatos;
        const q = search.toLowerCase();
        return cd.nombre.toLowerCase().includes(q) || cd.telefono.includes(q);
      })
    : [];

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Pedidos</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {total} {total === 1 ? 'pedido' : 'pedidos'} · Arrastra para cambiar estado
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedIds(new Set()); }}
              placeholder="Buscar cliente…"
              className="pl-9 pr-8 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white w-48"
            />
            {search && (
              <button onClick={() => { setSearch(''); setSelectedIds(new Set()); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <a href="/api/admin/export/pedidos" download>
            <button className="flex items-center gap-2 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              <Download className="w-4 h-4" />CSV
            </button>
          </a>
          <button onClick={() => setIsCrearOpen(true)}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />Nuevo pedido
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <span className="text-sm font-medium text-amber-800">{selectedIds.size} seleccionado(s)</span>
          <button onClick={handleBulkComplete} disabled={bulkLoading}
            className="text-sm font-semibold text-green-700 hover:underline disabled:opacity-50 flex items-center gap-1">
            {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '✓'}
            Marcar como completado
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search results list */}
      {search.trim() && (
        <div className="flex-1 overflow-auto">
          <p className="text-xs text-stone-500 mb-3">{searchResults.length} resultado(s) para &ldquo;{search}&rdquo;</p>
          {searchResults.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-12">Sin resultados.</p>
          ) : (
            <div className="space-y-2">
              {searchResults.map(p => {
                const cd = p.cliente_datos as ClienteDatos;
                const checked = selectedIds.has(p.id);
                return (
                  <div key={p.id} onClick={() => toggleSelect(p.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${checked ? 'border-amber-400 bg-amber-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}>
                    {checked ? <CheckSquare className="w-4 h-4 text-amber-600 flex-shrink-0" /> : <Square className="w-4 h-4 text-stone-300 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-stone-800">{cd.nombre}</p>
                      <p className="text-xs text-stone-400">{cd.telefono} · {new Date(p.created_at).toLocaleDateString('es-HN')}</p>
                    </div>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                      p.estado === 'completado' ? 'bg-stone-100 text-stone-500' :
                      p.estado === 'listo' ? 'bg-green-100 text-green-700' :
                      p.estado === 'preparacion' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{p.estado}</span>
                    <span className="font-bold text-amber-800 text-sm">L.{Number(p.total).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal crear pedido */}
      {isCrearOpen && (
        <CrearPedidoModal
          productos={productos}
          onSuccess={() => { setIsCrearOpen(false); router.refresh(); }}
          onClose={() => setIsCrearOpen(false)}
        />
      )}

      {!search.trim() && (
        <>
          {/* Error toast */}
          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {errorMsg}
            </div>
          )}

          {/* Kanban board */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 min-h-0">
              {COLUMNAS.map(({ estado, label, color, dot }) => (
                <div key={estado} className={`flex flex-col bg-stone-100 rounded-2xl border-t-4 ${color} overflow-hidden`}>
                  <div className="px-3 py-3 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                    <span className="font-semibold text-sm text-stone-700">{label}</span>
                    <span className="ml-auto text-xs font-medium text-stone-400 bg-white rounded-full px-2 py-0.5 border border-stone-200">
                      {columns[estado].length}
                    </span>
                  </div>
                  <Droppable droppableId={estado}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 px-3 pb-3 space-y-2 overflow-y-auto min-h-[120px] transition-colors ${snapshot.isDraggingOver ? 'bg-stone-200/60' : ''}`}
                      >
                        {columns[estado].map((pedido, index) => (
                          <Draggable key={pedido.id} draggableId={pedido.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`relative group transition-shadow ${snapshot.isDragging ? 'shadow-xl rotate-1' : ''}`}
                              >
                                <PedidoCard pedido={pedido} />
                                <button
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={() => printPedido(pedido)}
                                  aria-label="Imprimir ticket"
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-stone-700 bg-white rounded-lg p-1 shadow-sm"
                                >
                                  <Printer className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {columns[estado].length === 0 && (
                          <p className="text-xs text-stone-400 text-center py-6">Sin pedidos</p>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </>
      )}
    </div>
  );
}
