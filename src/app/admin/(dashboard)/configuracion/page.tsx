import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ConfiguracionClient from './ConfiguracionClient';
import type { Configuracion } from '@/types/database';

const DEFAULT_CONFIG: Configuracion = {
  id: 1,
  nombre: 'Brownie Lab',
  tagline: '',
  descripcion: null,
  whatsapp: '',
  correo: '',
  ubicacion: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  envio_gratis_desde: '',
  anticipacion_minima: '',
  horario_atencion: '',
  aviso_barra_superior: '',
  mensaje_bienvenida: '',
  logo_url: null,
  hero_imagen_url: null,
  nosotros_imagen_url: null,
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
