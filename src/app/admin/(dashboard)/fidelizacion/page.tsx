'use client';

import { useState, useTransition } from 'react';
import { Search, Loader2, Plus, Award } from 'lucide-react';
import { buscarCliente, registrarCompraAdmin, type ClienteFidelizacion, type CuponFidelizacion } from '@/actions/fidelizacion';

const LOYALTY_MAX = 10;

function LoyaltyDots({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
      {Array.from({ length: LOYALTY_MAX }).map((_, i) => (
        <span key={i} style={{
          width: 12, height: 12, borderRadius: '50%', flexShrink: 0, fontSize: 10, transition: '.15s',
          background: i < current ? 'var(--orange)' : 'var(--cream-200)',
          boxShadow: i < current ? '0 0 0 2px rgba(217,113,30,.25)' : 'none',
          display: 'grid', placeItems: 'center',
        }}>
          {i < current ? <span style={{ fontSize: 7 }}>🍪</span> : ''}
        </span>
      ))}
      <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>
        {current}/{LOYALTY_MAX}
      </span>
    </div>
  );
}

type SearchState =
  | { tipo: 'idle' }
  | { tipo: 'found'; cliente: ClienteFidelizacion; cupones: CuponFidelizacion[] }
  | { tipo: 'error'; mensaje: string };

export default function FidelizacionPage() {
  const [telefono,  setTelefono]   = useState('');
  const [estado,    setEstado]     = useState<SearchState>({ tipo: 'idle' });
  const [isPending, startTransition] = useTransition();
  const [addMsg,    setAddMsg]     = useState<string | null>(null);
  const [adding,    setAdding]     = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!telefono.trim()) return;
    startTransition(async () => {
      const result = await buscarCliente(telefono);
      if (result.success) setEstado({ tipo: 'found', cliente: result.data.cliente, cupones: result.data.cupones });
      else setEstado({ tipo: 'error', mensaje: result.error });
    });
  }

  async function handleAgregarCompra() {
    if (estado.tipo !== 'found') return;
    if (!confirm(`¿Registrar una compra manual para ${estado.cliente.nombre}?`)) return;
    setAdding(true);
    setAddMsg(null);
    const result = await registrarCompraAdmin(estado.cliente.telefono);
    setAdding(false);
    if (result.success) {
      setAddMsg(result.data.cuponGenerado
        ? `✓ Compra registrada. ¡Cupón generado: ${result.data.cuponGenerado.codigo_unico}!`
        : `✓ Compra registrada. Sellos: ${result.data.cliente.compras_actuales}/10`
      );
      // Refresh client data
      const r = await buscarCliente(estado.cliente.telefono);
      if (r.success) setEstado({ tipo: 'found', cliente: r.data.cliente, cupones: r.data.cupones });
    } else {
      setAddMsg(`Error: ${result.error}`);
    }
  }

  const INP: React.CSSProperties = {
    border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '11px 14px',
    fontSize: 14, color: 'var(--ink)', background: 'var(--paper)',
    outline: 'none', fontFamily: 'ui-monospace,monospace', letterSpacing: '.04em',
  };

  return (
    <div className="px-6 md:px-10 py-8 pb-16 max-w-[800px] w-full">

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-.01em', margin: 0 }}>
          Fidelización
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 }}>
          Consulta y gestiona los sellos y cupones de los clientes.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--ink-soft)', pointerEvents: 'none' }} />
          <input
            type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
            placeholder="Teléfono del cliente (ej: 99991234)"
            style={{ ...INP, paddingLeft: 40, width: '100%' }}
            onFocus={e => e.target.style.borderColor = 'var(--orange)'}
            onBlur={e => e.target.style.borderColor = 'var(--hairline)'}
          />
        </div>
        <button type="submit" disabled={isPending || !telefono.trim()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '11px 20px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--orange)', color: '#fff', opacity: isPending || !telefono.trim() ? 0.6 : 1 }}>
          {isPending ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Search style={{ width: 15, height: 15 }} />}
          Buscar
        </button>
      </form>

      {/* Results */}
      {estado.tipo === 'error' && (
        <div style={{ background: 'rgba(158,59,70,.08)', border: '1px solid rgba(158,59,70,.25)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 14, color: 'var(--berry)' }}>
          {estado.mensaje}
        </div>
      )}

      {estado.tipo === 'found' && (() => {
        const { cliente, cupones } = estado;
        const remaining = LOYALTY_MAX - cliente.compras_actuales;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Client card */}
            <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--ink)', margin: 0 }}>{cliente.nombre}</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'ui-monospace,monospace', margin: '4px 0 0' }}>{cliente.telefono}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--orange-ink)', margin: 0 }}>{cliente.compras_totales}</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>compras totales</p>
                </div>
              </div>

              {/* Loyalty progress */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>Sellos del ciclo actual</p>
                <LoyaltyDots current={cliente.compras_actuales} />
                {remaining > 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>Faltan <strong>{remaining}</strong> compras para un brownie gratis</p>
                ) : (
                  <p style={{ fontSize: 13, color: '#1f8a5b', fontWeight: 600, marginTop: 8 }}>🎉 ¡Tiene un brownie gratis disponible!</p>
                )}
              </div>

              {/* Feedback message */}
              {addMsg && (
                <div style={{ background: addMsg.startsWith('Error') ? 'rgba(158,59,70,.08)' : 'rgba(31,138,91,.08)', border: `1px solid ${addMsg.startsWith('Error') ? 'rgba(158,59,70,.25)' : 'rgba(31,138,91,.2)'}`, borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13, color: addMsg.startsWith('Error') ? 'var(--berry)' : '#1f8a5b', marginBottom: 14 }}>
                  {addMsg}
                </div>
              )}

              {/* Action */}
              <button
                onClick={handleAgregarCompra} disabled={adding}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: 'pointer', background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', opacity: adding ? 0.7 : 1 }}>
                {adding ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Plus style={{ width: 15, height: 15 }} />}
                Registrar compra manual
              </button>
            </div>

            {/* Cupones */}
            {cupones.length > 0 && (
              <div style={{ background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Award style={{ width: 18, height: 18, color: 'var(--orange-ink)' }} />
                  <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: 0 }}>
                    Cupones disponibles ({cupones.length})
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cupones.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(31,138,91,.07)', border: '1px solid rgba(31,138,91,.2)', borderRadius: 'var(--r-md)', padding: '10px 16px' }}>
                      <div>
                        <p style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 700, fontSize: 15, color: '#1f5c3a', letterSpacing: '.1em', margin: 0 }}>{c.codigo_unico}</p>
                        <p style={{ fontSize: 12, color: '#1f8a5b', margin: '2px 0 0' }}>1 brownie gratis · DISPONIBLE</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--r-pill)', background: 'rgba(31,138,91,.15)', color: '#1f8a5b' }}>
                        {new Date(c.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        );
      })()}

    </div>
  );
}
