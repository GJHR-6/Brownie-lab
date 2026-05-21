'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, ImageOff } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface FileInfo {
  name: string;
  size: number;
  url: string;
  orphaned: boolean;
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GaleriaClient({ files }: { files: FileInfo[] }) {
  const router = useRouter();
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<'all' | 'orphaned'>('all');

  const visible = filter === 'orphaned' ? files.filter(f => f.orphaned) : files;
  const orphanedCount = files.filter(f => f.orphaned).length;

  async function handleDelete(name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingName(name);
    const supabase = createSupabaseBrowserClient();
    await supabase.storage.from('product-images').remove([name]);
    setDeletingName(null);
    startTransition(() => { router.refresh(); });
  }

  async function handleDeleteOrphaned() {
    if (!confirm(`¿Eliminar ${orphanedCount} imágenes sin usar? Esta acción no se puede deshacer.`)) return;
    const supabase = createSupabaseBrowserClient();
    const names = files.filter(f => f.orphaned).map(f => f.name);
    await supabase.storage.from('product-images').remove(names);
    startTransition(() => { router.refresh(); });
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Galería de imágenes</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {files.length} archivos · {orphanedCount} sin usar
            {isPending && <span className="ml-2 text-amber-600">Actualizando…</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-stone-200 overflow-hidden">
            {(['all', 'orphaned'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${filter === f ? 'bg-amber-800 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}>
                {f === 'all' ? 'Todas' : `Sin usar (${orphanedCount})`}
              </button>
            ))}
          </div>
          {orphanedCount > 0 && (
            <button onClick={handleDeleteOrphaned}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              <Trash2 className="w-4 h-4" />
              Limpiar sin usar
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <ImageOff className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No hay imágenes {filter === 'orphaned' ? 'sin usar' : ''}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {visible.map((f) => (
            <div key={f.name} className={`group relative rounded-2xl overflow-hidden border-2 ${f.orphaned ? 'border-red-200' : 'border-stone-200'} bg-stone-50`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.name} className="w-full aspect-square object-cover" loading="lazy" />
              {f.orphaned && (
                <div className="absolute top-2 left-2">
                  <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5 font-medium">Sin usar</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <button
                  onClick={() => handleDelete(f.name)}
                  disabled={deletingName === f.name}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-400 text-white rounded-full p-2.5 disabled:opacity-50"
                >
                  {deletingName === f.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
              <div className="px-2 py-1.5">
                <p className="text-xs text-stone-500 truncate">{f.name}</p>
                <p className="text-xs text-stone-400">{fmtSize(f.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
