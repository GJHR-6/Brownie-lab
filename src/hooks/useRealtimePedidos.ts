'use client';

import { useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export type PedidoRealtimeEvent = 'insert' | 'update';

// Escucha INSERTs (pedidos nuevos) y UPDATEs (cambios de estado desde otro
// dispositivo) en la tabla pedidos.
export function useRealtimePedidos(onEvent: (tipo: PedidoRealtimeEvent) => void) {
  const cbRef = useRef(onEvent);
  useEffect(() => { cbRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel('admin-pedidos-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, () => {
        cbRef.current('insert');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, () => {
        cbRef.current('update');
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);
}
