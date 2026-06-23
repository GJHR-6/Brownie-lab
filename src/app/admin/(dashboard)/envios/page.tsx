import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EnviosClient from './EnviosClient';
import { parseConfigEnvio } from '@/lib/envio';

export default async function EnviosPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data } = await supabase
    .from('configuracion')
    .select('envio_sedes, envio_por_km, envio_factor_ruta, envio_km_max, envio_gratis_monto, envio_modo')
    .eq('id', 1)
    .single();

  const envioModo: 'distancia' | 'zonas' = data?.envio_modo === 'zonas' ? 'zonas' : 'distancia';

  return <EnviosClient config={parseConfigEnvio(data ?? {})} envioModo={envioModo} />;
}
