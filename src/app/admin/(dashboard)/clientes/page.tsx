import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ClientesClient from './ClientesClient';

export default async function ClientesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: clientes } = await supabase
    .from('clientes')
    .select(`
      telefono, nombre, compras_actuales, compras_totales, created_at, updated_at,
      pedidos!telefono_cliente(count),
      cupones(count)
    `)
    .gt('compras_totales', 0)
    .order('compras_totales', { ascending: false });

  return <ClientesClient clientes={clientes ?? []} />;
}
