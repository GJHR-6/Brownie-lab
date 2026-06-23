'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Check } from 'lucide-react';
import { useConfirm } from '@/components/admin/ConfirmProvider';
import { confirmarPagoGiftCard, cancelarGiftCard } from '@/actions/giftCards';
import type { GiftCard, EstadoGiftCard } from '@/types/database';

const ESTADO_CFG: Record<EstadoGiftCard, { label: string; chip: string; dot: string }> = {
  pendiente: { label: 'Pendiente', chip: '#fbeccb', dot: '#9a6a12' },
  activa:    { label: 'Activa',    chip: '#d8f0e2', dot: '#157a4d' },
  agotada:   { label: 'Agotada',   chip: '#e4ded3', dot: '#6b5743' },
  cancelada: { label: 'Cancelada', chip: '#fce8ea', dot: '#9e3b46' },
};

const T = {
  th: { textAlign: 'left' as const, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--ink-soft)', padding: '14px 22px', borderBottom: '1px solid var(--hairline)', whiteSpace: 'nowrap' as const, background: 'var(--paper)' },
  td: { padding: '14px 22px', fontSize: 14, color: 'var(--ink)', verticalAlign: 'middle' as const, borderBottom: '1px solid var(--hairline)' },
};

function Chip({ estado }: { estado: EstadoGiftCard }) {
  const c = ESTADO_CFG[estado];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 'var(--r-pill)', background: c.chip, color: c.dot, whiteSpace: 'nowrap' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

export default function TarjetasRegaloClient({ initialGiftCards }: { initialGiftCards: GiftCard[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoGiftCard | 'todos'>('todos');
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const confirmar = useConfirm();

  const refresh = () => startTransition(() => { router.refresh(); });

  const visible = initialGiftCards.filter(gc => {
    if (estadoFilter !== 'todos' && gc.estado !== estadoFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return gc.codigo.toLowerCase().includes(q) || gc.comprador_telefono.includes(q) || (gc.destinatario_telefono?.includes(q) ?? false);
    }
    return true;
  });

  async function handleConfirmar(gc: GiftCard) {
    if (!(await confirmar({ titulo: 'Confirmar pago', mensaje: `Se activará la tarjeta ${gc.codigo} por L.${Number(gc.monto).toFixed(2)}.`, confirmLabel: 'Confirmar pago' }))) return;
    setActingId(gc.id); setError(null);
    const result = await confirmarPagoGiftCard(gc.id);
    setActingId(null);
    if (!result.success) setError(result.error);
    else refresh();
  }

  async function handleCancelar(gc: GiftCard) {
    if (!(await confirmar({ titulo: 'Cancelar tarjeta', mensaje: `La tarjeta ${gc.codigo} quedará cancelada y no podrá usarse.`, confirmLabel: 'Cancelar tarjeta', peligro: true }))) return;
    setActingId(gc.id); setError(null);
    const result = await cancelarGiftCard(gc.id);
    setActingId(null);
    if (!result.success) setError(result.error);
    else refresh();
  }

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[1500px] w-full">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>
          Tarjetas de regalo
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
          Confirma el pago para activar una tarjeta comprada, o cancélala.
        </p>
      </div>

      {error && (
        <div style={{ background: '#fdf0f0', border: '1px solid #e6c4c8', borderLeft: '4px solid var(--berry)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 14, color: 'var(--berry)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search style={{ position: 'absolute', left: 14, width: 17, height: 17, color: 'var(--ink-soft)', pointerEvents: 'none' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código o teléfono…"
            style={{ padding: '10px 16px 10px 40px', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', background: 'var(--paper-card)', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)', width: 280, outline: 'none' }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
        <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value as EstadoGiftCard | 'todos')} className="bl-select"
          style={{ padding: '10px 16px', border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-pill)', background: 'var(--paper-card)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', outline: 'none' }}>
          <option value="todos">Todos los estados</option>
          {(Object.keys(ESTADO_CFG) as EstadoGiftCard[]).map(e => <option key={e} value={e}>{ESTADO_CFG[e].label}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-soft)', fontWeight: 500 }}>
          {visible.length} tarjeta{visible.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={T.th}>Código</th>
                <th style={T.th}>Comprador</th>
                <th style={T.th}>Destinatario</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Monto</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Saldo</th>
                <th style={T.th}>Estado</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(gc => (
                <tr key={gc.id}>
                  <td style={T.td}>
                    <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12.5, background: 'var(--cream-200)', color: 'var(--ink)', padding: '4px 9px', borderRadius: 6, fontWeight: 700 }}>
                      {gc.codigo}
                    </span>
                  </td>
                  <td style={{ ...T.td, fontFamily: 'ui-monospace,monospace', fontSize: 13 }}>{gc.comprador_telefono}</td>
                  <td style={T.td}>
                    {gc.destinatario_nombre
                      ? <span>{gc.destinatario_nombre}{gc.destinatario_telefono ? <span style={{ color: 'var(--ink-soft)' }}> · {gc.destinatario_telefono}</span> : null}</span>
                      : <span style={{ color: 'var(--ink-soft)' }}>—</span>}
                  </td>
                  <td style={{ ...T.td, textAlign: 'right', fontWeight: 600 }}>L.{Number(gc.monto).toFixed(2)}</td>
                  <td style={{ ...T.td, textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange-ink)' }}>L.{Number(gc.saldo).toFixed(2)}</td>
                  <td style={T.td}><Chip estado={gc.estado} /></td>
                  <td style={{ ...T.td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {gc.estado === 'pendiente' && (
                        <button onClick={() => handleConfirmar(gc)} disabled={actingId === gc.id}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, padding: '7px 12px', borderRadius: 'var(--r-pill)', border: 'none', cursor: 'pointer', background: 'var(--green)', color: '#fff', opacity: actingId === gc.id ? 0.6 : 1 }}>
                          {actingId === gc.id ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Check style={{ width: 13, height: 13 }} />}
                          Confirmar pago
                        </button>
                      )}
                      {(gc.estado === 'pendiente' || gc.estado === 'activa') && (
                        <button onClick={() => handleCancelar(gc)} disabled={actingId === gc.id}
                          style={{ fontSize: 12.5, fontWeight: 700, padding: '7px 12px', borderRadius: 'var(--r-pill)', border: '1.5px solid #e6c4c8', cursor: 'pointer', background: '#fce8ea', color: '#9e3b46', opacity: actingId === gc.id ? 0.6 : 1 }}>
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...T.td, textAlign: 'center', padding: '48px 22px', color: 'var(--ink-soft)' }}>
                    {search || estadoFilter !== 'todos' ? 'Sin resultados para este filtro.' : 'No hay tarjetas de regalo aún.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
