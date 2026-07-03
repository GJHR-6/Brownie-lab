import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Guard para server actions del admin. Verifica dos capas:
 * 1. Sesión autenticada (JWT válido contra Supabase Auth).
 * 2. Rol de admin: el usuario debe existir en la tabla admin_users.
 *
 * El login con Google acepta cualquier cuenta, por lo que verificar solo
 * la sesión NO es suficiente — siempre usar este guard en acciones admin.
 */
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const { data: adminRecord } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single();
  if (!adminRecord) throw new Error('No autorizado');

  return { supabase, user };
}
