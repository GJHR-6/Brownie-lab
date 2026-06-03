import { createSupabaseServerClient } from '@/lib/supabase/server';
import GaleriaClient from './GaleriaClient';

export type SiteSlot = {
  key: 'hero_imagen_url' | 'nosotros_imagen_url' | 'personalizador_imagen_url';
  label: string;
  hint: string;
  aspect: string;
};

export const SITE_SLOTS: SiteSlot[] = [
  { key: 'hero_imagen_url',          label: 'Inicio · Hero',    hint: 'Cuadrado 1:1, fondo oscuro',    aspect: '1/1'  },
  { key: 'nosotros_imagen_url',      label: 'Nosotros · Historia', hint: 'Vertical 4:5',               aspect: '4/5'  },
  { key: 'personalizador_imagen_url',label: 'Arma tu postre',   hint: 'Cuadrado 1:1, fondo claro',    aspect: '1/1'  },
];

export interface FileInfo {
  name: string;
  size: number;
  url: string;
  usages: string[];   // human-readable labels, e.g. ["Inicio · Hero", "Producto: Brownie Clásico"]
}

export interface SiteImageSlot extends SiteSlot {
  currentUrl: string | null;
  storageName: string | null; // file name in storage bucket, derived from URL
}

export default async function GaleriaPage() {
  const supabase = await createSupabaseServerClient();

  const [filesRes, productosRes, especialesRes, configRes] = await Promise.all([
    supabase.storage.from('product-images').list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } }),
    supabase.from('productos').select('nombre, imagen_url').not('imagen_url', 'is', null),
    supabase.from('especiales').select('nombre, imagen_url').not('imagen_url', 'is', null),
    supabase.from('configuracion').select('hero_imagen_url, nosotros_imagen_url, personalizador_imagen_url').single(),
  ]);

  const rawFiles = (filesRes.data ?? []).filter(f => f.name !== '.emptyFolderPlaceholder');
  const { data: { publicUrl: baseUrl } } = supabase.storage.from('product-images').getPublicUrl('');

  // Build a map: storageFileName → [usage labels]
  const usageMap = new Map<string, string[]>();

  function registerUrl(url: string | null | undefined, label: string) {
    if (!url) return;
    try {
      const name = new URL(url).pathname.split('/product-images/')[1];
      if (!name) return;
      const existing = usageMap.get(name) ?? [];
      usageMap.set(name, [...existing, label]);
    } catch { /* invalid URL */ }
  }

  // Config site images
  const cfg = configRes.data;
  if (cfg) {
    registerUrl(cfg.hero_imagen_url,            'Inicio · Hero');
    registerUrl(cfg.nosotros_imagen_url,         'Nosotros · Historia');
    registerUrl(cfg.personalizador_imagen_url,   'Arma tu postre');
  }

  // Product images
  for (const p of productosRes.data ?? []) registerUrl(p.imagen_url, `Producto: ${p.nombre}`);

  // Especial images
  for (const e of especialesRes.data ?? []) registerUrl(e.imagen_url, `Especial: ${e.nombre}`);

  // logo is always from config — handled by the naming convention
  usageMap.set('logo.png',  [...(usageMap.get('logo.png')  ?? []), 'Logo del sitio']);
  usageMap.set('logo.jpg',  [...(usageMap.get('logo.jpg')  ?? []), 'Logo del sitio']);
  usageMap.set('logo.webp', [...(usageMap.get('logo.webp') ?? []), 'Logo del sitio']);
  usageMap.set('logo.svg',  [...(usageMap.get('logo.svg')  ?? []), 'Logo del sitio']);

  const files: FileInfo[] = rawFiles.map(f => ({
    name: f.name,
    size: f.metadata?.size ?? 0,
    url: `${baseUrl}${f.name}`,
    usages: usageMap.get(f.name) ?? [],
  }));

  // Site image slots with current URLs
  const siteSlots: SiteImageSlot[] = SITE_SLOTS.map(slot => {
    const currentUrl = cfg?.[slot.key] ?? null;
    let storageName: string | null = null;
    if (currentUrl) {
      try { storageName = new URL(currentUrl).pathname.split('/product-images/')[1] ?? null; } catch { /* */ }
    }
    return { ...slot, currentUrl, storageName };
  });

  return <GaleriaClient files={files} siteSlots={siteSlots} />;
}
