import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ConfiguracionClient from './ConfiguracionClient';
import type { Configuracion } from '@/types/database';

const DEFAULT_CONFIG: Configuracion = {
  id: 1,
  nombre: 'Brownie Lab',
  tagline: 'Horneado con amor, cada galleta cuenta',
  descripcion: null,
  whatsapp: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  banco_nombre: '',
  banco_titular: '',
  banco_numero: '',
  updated_at: new Date().toISOString(),
};

export default async function ConfiguracionPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data } = await supabase
    .from('configuracion')
    .select('*')
    .single();

  const config: Configuracion = data ?? DEFAULT_CONFIG;

  return <ConfiguracionClient config={config} />;
}
