import { createSupabaseServerClient } from '@/lib/supabase/server';
import GaleriaClient from './GaleriaClient';

export default async function GaleriaPage() {
  const supabase = await createSupabaseServerClient();

  const [filesRes, productosRes] = await Promise.all([
    supabase.storage.from('product-images').list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } }),
    supabase.from('productos').select('imagen_url').not('imagen_url', 'is', null),
  ]);

  const files = (filesRes.data ?? []).filter(f => f.name !== '.emptyFolderPlaceholder');
  const usedPaths = new Set(
    (productosRes.data ?? [])
      .map(p => p.imagen_url)
      .filter(Boolean)
      .map(url => {
        try { return new URL(url!).pathname.split('/product-images/')[1]; } catch { return null; }
      })
      .filter(Boolean) as string[]
  );

  const { data: { publicUrl: baseUrl } } = supabase.storage.from('product-images').getPublicUrl('');

  return (
    <GaleriaClient
      files={files.map(f => ({
        name: f.name,
        size: f.metadata?.size ?? 0,
        url: `${baseUrl}${f.name}`,
        orphaned: !usedPaths.has(f.name),
      }))}
    />
  );
}
