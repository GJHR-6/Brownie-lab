'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface LogEntry {
  id: string;
  usuario_email: string | null;
  tipo: string;
  descripcion: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function getActividad(limit = 100): Promise<LogEntry[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('actividad_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function logActividad(
  tipo: string,
  descripcion: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('actividad_log').insert({
      usuario_email: user?.email ?? null,
      tipo,
      descripcion,
      metadata: metadata ?? null,
    });
  } catch {
    // Log failures are non-fatal — never crash the main action
  }
}
