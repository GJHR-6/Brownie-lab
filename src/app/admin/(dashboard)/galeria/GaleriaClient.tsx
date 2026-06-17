'use client';

import { useConfirm } from '@/components/admin/ConfirmProvider';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, Upload, ImageOff } from 'lucide-react';
import { subirImagenGaleria, actualizarImagenSitio, eliminarImagenGaleria } from '@/actions/galeria';
import type { FileInfo, SiteImageSlot } from './page';

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .4 }}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/>
    <circle cx="8.5" cy="9.5" r="1.6"/>
    <path d="M4 17l4.5-4.5 3.5 3.5 3-3 5 5"/>
  </svg>
);

/* Badge de uso para cada imagen */
function UsageBadge({ label }: { label: string }) {
  const isProduct     = label.startsWith('Producto:');
  const isEspecial    = label.startsWith('Especial:');
  const isSite        = !isProduct && !isEspecial;

  const color = isProduct  ? { bg: '#dbeafe', fg: '#1d5fb8' }
              : isEspecial ? { bg: 'var(--cream-200)', fg: 'var(--orange-ink)' }
              :              { bg: '#d8f0e2', fg: '#157a4d' };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--r-pill)', background: color.bg, color: color.fg, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

/* Slot de imagen del sitio (hero, nosotros, personalizador) */
function SiteSlotTile({ slot, onUploaded }: { slot: SiteImageSlot; onUploaded: () => void }) {
  const [preview, setPreview] = useState<string | null>(slot.currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append('slotKey', slot.key);
    fd.append('file', file);
    const result = await actualizarImagenSitio(null, fd);

    setUploading(false);
    if (!result.success) {
      setError(result.error ?? 'Error al subir');
      return;
    }
    onUploaded();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Label */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{slot.label}</p>
        <p style={{ fontSize: 11, color: 'var(--ink-soft)', margin: '2px 0 0' }}>{slot.hint}</p>
      </div>

      {/* Image tile */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          width: '100%',
          aspectRatio: slot.aspect,
          borderRadius: 'var(--r-md)',
          border: `1.6px dashed ${preview ? 'var(--hairline)' : 'var(--hairline)'}`,
          background: `repeating-linear-gradient(135deg,rgba(116,58,20,.06) 0 9px,rgba(116,58,20,0) 9px 18px),var(--cream)`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', overflow: 'hidden', padding: 0, position: 'relative', transition: '.14s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hairline)'; }}
      >
        {preview
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={preview} alt={slot.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--ink-soft)' }}>
              <Upload style={{ width: 20, height: 20 }} />
              <span style={{ fontSize: 11, fontFamily: 'ui-monospace,monospace' }}>Sin imagen</span>
            </div>
        }
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(251,246,236,.8)', display: 'grid', placeItems: 'center' }}>
            <Loader2 style={{ width: 24, height: 24, color: 'var(--orange)', animation: 'spin 1s linear infinite' }} />
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleChange} style={{ display: 'none' }} />
      {error && <p style={{ fontSize: 11, color: 'var(--berry)', margin: 0 }}>{error}</p>}
    </div>
  );
}

export default function GaleriaClient({ files, siteSlots }: { files: FileInfo[]; siteSlots: SiteImageSlot[] }) {
  const router = useRouter();
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const confirmar = useConfirm();

  async function handleDelete(name: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!(await confirmar({ mensaje: `La imagen "${name}" se eliminará permanentemente. Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar', peligro: true }))) return;
    setDeletingName(name);
    const result = await eliminarImagenGaleria(name);
    setDeletingName(null);
    if (!result.success) setUploadError(result.error ?? 'Error al eliminar');
    startTransition(() => { router.refresh(); });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    Array.from(fileList).forEach(f => formData.append('files', f));
    const result = await subirImagenGaleria(null, formData);
    if (!result.success) setUploadError(result.error ?? 'Error al subir');
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    startTransition(() => { router.refresh(); });
  }

  const orphanedCount = files.filter(f => f.usages.length === 0).length;

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">

      {/* Page head */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>Galería</h1>
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
          {uploading ? <Loader2 style={{ width: 17, height: 17, animation: 'spin 1s linear infinite' }} /> : <Upload style={{ width: 17, height: 17 }} />}
          Subir imágenes
        </button>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleUpload} style={{ display: 'none' }} />
      </div>

      {uploadError && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderLeft: '4px solid var(--berry)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 14, color: 'var(--berry)', marginBottom: 20 }}>
          {uploadError}
        </div>
      )}

      {/* ── Imágenes del sitio ── */}
      <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', padding: '22px 26px', marginBottom: 28 }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', margin: '0 0 4px' }}>
          Imágenes del sitio
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 20px' }}>
          Aparecen en secciones específicas del sitio público. Click en la imagen para reemplazar.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 24 }}>
          {siteSlots.map(slot => (
            <SiteSlotTile key={slot.key} slot={slot} onUploaded={() => startTransition(() => { router.refresh(); })} />
          ))}
        </div>
      </div>

      {/* ── Stats strip ── */}
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 18, fontWeight: 500 }}>
        {files.length} {files.length === 1 ? 'imagen' : 'imágenes'}
        {orphanedCount > 0 && <> · <span style={{ color: 'var(--berry)', fontWeight: 700 }}>{orphanedCount} sin usar</span></>}
      </p>

      {/* ── Image grid ── */}
      {files.length === 0 && !uploading ? (
        <div style={{ textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)' }}>
          <ImageOff style={{ width: 36, height: 36, margin: '0 auto 10px', opacity: 0.4 }} />
          <p style={{ fontSize: 15 }}>No hay imágenes aún.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 18 }}>

          {/* Upload tile */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ background: 'var(--paper-card)', border: '1.6px dashed var(--hairline)', borderRadius: 'var(--r-md)', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s', padding: 10, fontFamily: 'var(--font-sans)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.color = 'var(--orange-ink)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hairline)'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
          >
            <Upload style={{ width: 22, height: 22 }} />
            <span style={{ fontSize: 12, fontFamily: 'ui-monospace,monospace' }}>Subir imagen</span>
          </button>

          {/* Image tiles */}
          {files.map((f) => (
            <div key={f.name} style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              {/* Image area */}
              <div style={{ aspectRatio: '1/1', background: `repeating-linear-gradient(135deg,rgba(116,58,20,.08) 0 9px,rgba(116,58,20,0) 9px 18px),var(--cream)`, display: 'grid', placeItems: 'center', overflow: 'hidden', position: 'relative', color: 'var(--orange-ink)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={f.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <ImageIcon />
              </div>

              {/* Caption */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                      {f.name.replace(/\.[^.]+$/, '').replace(/^\d+-[a-z0-9]+-?/, '') || f.name}
                    </p>
                    {/* Usage badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                      {f.usages.length > 0
                        ? f.usages.map((u, i) => <UsageBadge key={i} label={u} />)
                        : <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--berry)', fontFamily: 'ui-monospace,monospace' }}>sin usar</span>
                      }
                    </div>
                  </div>
                  <button
                    onClick={ev => handleDelete(f.name, ev)}
                    disabled={deletingName === f.name}
                    style={{ width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', background: 'var(--paper-card)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', cursor: 'pointer', transition: '.14s', flexShrink: 0, opacity: deletingName === f.name ? 0.5 : 1 }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--berry)'; e.currentTarget.style.borderColor = 'var(--berry)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--hairline)'; }}
                  >
                    {deletingName === f.name
                      ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                      : <Trash2 style={{ width: 13, height: 13 }} />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
