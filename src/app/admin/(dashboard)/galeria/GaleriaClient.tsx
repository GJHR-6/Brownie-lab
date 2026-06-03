'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, Upload } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface FileInfo {
  name: string;
  size: number;
  url: string;
  orphaned: boolean;
}

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .5 }}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/>
    <circle cx="8.5" cy="9.5" r="1.6"/>
    <path d="M4 17l4.5-4.5 3.5 3.5 3-3 5 5"/>
  </svg>
);

export default function GaleriaClient({ files }: { files: FileInfo[] }) {
  const router = useRouter();
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleDelete(name: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingName(name);
    const supabase = createSupabaseBrowserClient();
    await supabase.storage.from('product-images').remove([name]);
    setDeletingName(null);
    startTransition(() => { router.refresh(); });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadError(null);
    const supabase = createSupabaseBrowserClient();

    const results = await Promise.allSettled(
      Array.from(fileList).map(async (file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: false });
        if (error) throw new Error(error.message);
      })
    );

    const errors = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
    if (errors.length > 0) setUploadError(`${errors.length} archivo(s) no se pudieron subir.`);

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    startTransition(() => { router.refresh(); });
  }

  const orphanedCount = files.filter(f => f.orphaned).length;

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">

      {/* Page head */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>
            Galería
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
            Banco de imágenes para productos, banners y secciones del sitio.
            {(isPending || uploading) && <span style={{ marginLeft: 8, color: 'var(--orange-ink)' }}>Actualizando…</span>}
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', transition: '.16s', opacity: uploading ? 0.7 : 1 }}
        >
          {uploading
            ? <Loader2 style={{ width: 17, height: 17, animation: 'spin 1s linear infinite' }} />
            : <Upload style={{ width: 17, height: 17 }} />
          }
          Subir imágenes
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Upload error */}
      {uploadError && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderLeft: '4px solid var(--berry)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 14, color: 'var(--berry)', marginBottom: 20 }}>
          {uploadError}
        </div>
      )}

      {/* Stats strip */}
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 18, fontWeight: 500 }}>
        {files.length} {files.length === 1 ? 'imagen' : 'imágenes'}
        {orphanedCount > 0 && <> · <span style={{ color: 'var(--berry)', fontWeight: 700 }}>{orphanedCount} sin usar</span></>}
      </p>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 18 }}>

        {/* Upload tile */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            background: 'var(--paper-card)',
            border: '1.6px dashed var(--hairline)',
            borderRadius: 'var(--r-md)',
            aspectRatio: '1/1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'var(--ink-soft)',
            cursor: 'pointer',
            transition: '.14s',
            padding: 10,
            fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.color = 'var(--orange-ink)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hairline)'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
        >
          <Upload style={{ width: 22, height: 22 }} />
          <span style={{ fontSize: 12, fontFamily: 'ui-monospace,monospace' }}>Subir imagen</span>
        </button>

        {/* Image tiles */}
        {files.map((f) => (
          <div
            key={f.name}
            style={{
              background: 'var(--paper-card)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Image area */}
            <div style={{
              aspectRatio: '1/1',
              background: `repeating-linear-gradient(135deg,rgba(116,58,20,.08) 0 9px,rgba(116,58,20,0) 9px 18px),var(--cream)`,
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              position: 'relative',
              color: 'var(--orange-ink)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt={f.name}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <ImageIcon />
            </div>

            {/* Caption bar */}
            <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                  {f.name.replace(/\.[^.]+$/, '').replace(/^\d+-[a-z0-9]+-?/, '') || f.name}
                </p>
                <p style={{ fontSize: 11, marginTop: 2, fontWeight: 600, color: f.orphaned ? 'var(--berry)' : '#2f6fdb', fontFamily: 'ui-monospace,monospace' }}>
                  {f.orphaned ? 'sin usar' : 'en uso'}
                </p>
              </div>
              <button
                onClick={e => handleDelete(f.name, e)}
                disabled={deletingName === f.name}
                style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s', flexShrink: 0, opacity: deletingName === f.name ? 0.5 : 1 }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--berry)'; e.currentTarget.style.borderColor = 'var(--berry)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}
              >
                {deletingName === f.name
                  ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />
                  : <Trash2 style={{ width: 15, height: 15 }} />
                }
              </button>
            </div>
          </div>
        ))}

      </div>

      {files.length === 0 && !uploading && (
        <div style={{ textAlign: 'center', padding: '64px 22px', color: 'var(--ink-soft)' }}>
          <ImageIcon />
          <p style={{ fontSize: 15, marginTop: 12 }}>No hay imágenes aún. Sube la primera.</p>
        </div>
      )}
    </div>
  );
}
