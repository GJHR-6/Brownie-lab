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
  anticipacion_minima: '',
  horario_atencion: '',
  mensaje_bienvenida: '',
  logo_url: null,
  hero_imagen_url: null,
  nosotros_imagen_url: null,
  personalizador_imagen_url: null,
  banco_nombre: '',
  banco_titular: '',
  banco_numero: '',
  envio_sedes: [],
  envio_por_km: 10,
  envio_factor_ruta: 1.3,
  envio_km_max: 0,
  envio_gratis_monto: 0,
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
