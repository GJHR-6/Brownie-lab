'use client';

import { useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function useRealtimePedidos(onNew: () => void) {
  const cbRef = useRef(onNew);
  cbRef.current = onNew;

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel('admin-pedidos-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, () => {
        cbRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);
}
