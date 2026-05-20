'use client';

import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { actualizarEstadoPedido } from '@/actions/pedidos';
import PedidoCard from './PedidoCard';
import CrearPedidoModal from './CrearPedidoModal';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
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

export default function KanbanClient({ initialPedidos, productos }: KanbanClientProps) {
  const router = useRouter();
  const [isCrearOpen, setIsCrearOpen] = useState(false);
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

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Pedidos</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {total} {total === 1 ? 'pedido' : 'pedidos'} · Arrastra para cambiar estado
          </p>
        </div>
        <button
          onClick={() => setIsCrearOpen(true)}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo pedido
        </button>
      </div>

      {/* Modal crear pedido */}
      {isCrearOpen && (
        <CrearPedidoModal
          productos={productos}
          onSuccess={() => { setIsCrearOpen(false); router.refresh(); }}
          onClose={() => setIsCrearOpen(false)}
        />
      )}

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
            <div
              key={estado}
              className={`flex flex-col bg-stone-100 rounded-2xl border-t-4 ${color} overflow-hidden`}
            >
              {/* Columna header */}
              <div className="px-3 py-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                <span className="font-semibold text-sm text-stone-700">{label}</span>
                <span className="ml-auto text-xs font-medium text-stone-400 bg-white rounded-full px-2 py-0.5 border border-stone-200">
                  {columns[estado].length}
                </span>
              </div>

              {/* Droppable zona */}
              <Droppable droppableId={estado}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 px-3 pb-3 space-y-2 overflow-y-auto min-h-[120px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-stone-200/60' : ''
                    }`}
                  >
                    {columns[estado].map((pedido, index) => (
                      <Draggable
                        key={pedido.id}
                        draggableId={pedido.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transition-shadow ${
                              snapshot.isDragging ? 'shadow-xl rotate-1' : ''
                            }`}
                          >
                            <PedidoCard pedido={pedido} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {columns[estado].length === 0 && (
                      <p className="text-xs text-stone-400 text-center py-6">
                        Sin pedidos
                      </p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
