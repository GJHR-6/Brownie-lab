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
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">
      {/* Page head */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>
            Galería de imágenes
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            {files.length} archivos · {orphanedCount} sin usar
            {isPending && <span style={{ marginLeft: 8, color: 'var(--orange-ink)' }}>Actualizando…</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Filter segment */}
          <div style={{ display: 'inline-flex', background: 'var(--cream-200)', borderRadius: 'var(--r-pill)', padding: 4, gap: 2 }}>
            {(['all', 'orphaned'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ border: 0, fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, color: filter === f ? 'var(--ink)' : 'var(--ink-soft)', padding: '7px 16px', borderRadius: 'var(--r-pill)', cursor: 'pointer', background: filter === f ? 'var(--paper-card)' : 'none', boxShadow: filter === f ? 'var(--shadow-sm)' : 'none', transition: '.15s' }}>
                {f === 'all' ? 'Todas' : `Sin usar (${orphanedCount})`}
              </button>
            ))}
          </div>
          {orphanedCount > 0 && (
            <button onClick={handleDeleteOrphaned}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid #e6c4c8', cursor: 'pointer', background: 'var(--paper-card)', color: 'var(--berry)', transition: '.16s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--berry)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--paper-card)'; e.currentTarget.style.color = 'var(--berry)'; }}>
              <Trash2 style={{ width: 16, height: 16 }} />
              Limpiar sin usar
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 22px', color: 'var(--ink-soft)' }}>
          <ImageOff style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: 15 }}>No hay imágenes {filter === 'orphaned' ? 'sin usar' : ''}.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 18 }}>
          {visible.map((f) => (
            <div key={f.name}
              style={{ background: 'var(--paper-card)', border: `1px solid ${f.orphaned ? '#e6c4c8' : 'var(--hairline)'}`, borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative' }}
              className="group">
              {/* Image */}
              <div style={{ aspectRatio: '4/3', position: 'relative', overflow: 'hidden', background: 'var(--cream)', display: 'grid', placeItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                {f.orphaned && (
                  <div style={{ position: 'absolute', top: 8, left: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--r-pill)', background: 'var(--berry)', color: '#fff' }}>Sin usar</span>
                  </div>
                )}
                {/* Delete overlay */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,18,10,0)', transition: '.18s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(28,18,10,.38)'; const btn = e.currentTarget.querySelector('button') as HTMLButtonElement; if (btn) btn.style.opacity = '1'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(28,18,10,0)'; const btn = e.currentTarget.querySelector('button') as HTMLButtonElement; if (btn) btn.style.opacity = '0'; }}>
                  <button onClick={() => handleDelete(f.name)} disabled={deletingName === f.name}
                    style={{ width: 40, height: 40, borderRadius: 'var(--r-pill)', background: 'var(--berry)', color: '#fff', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', opacity: 0, transition: '.18s' }}>
                    {deletingName === f.name ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
              </div>
              {/* Caption */}
              <div style={{ padding: '10px 12px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{f.name}</p>
                <p style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'ui-monospace,monospace', marginTop: 2 }}>{fmtSize(f.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
