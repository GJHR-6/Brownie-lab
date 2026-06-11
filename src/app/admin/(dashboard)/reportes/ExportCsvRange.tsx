'use client';

import { useState } from 'react';
import { Download, Calendar, X } from 'lucide-react';

const inp: React.CSSProperties = {
  border: '1.5px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '8px 12px',
  fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink)', background: 'var(--paper)', outline: 'none',
};

export default function ExportCsvRange() {
  const [open, setOpen] = useState(false);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const params = new URLSearchParams();
  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta);
  const qs = params.size ? `?${params}` : '';
  const hrefPedidos = `/api/admin/export/pedidos${qs}`;
  // Sin rango, el contable exporta el mes actual por defecto
  const hrefContable = `/api/admin/export/contable${qs}`;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer', background: 'var(--paper-card)', color: 'var(--ink)', transition: '.16s' }}
      >
        <Download style={{ width: 16, height: 16 }} />
        Exportar CSV
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: 'var(--paper-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', padding: '10px 14px', boxShadow: 'var(--shadow-sm)' }}>
      <Calendar style={{ width: 15, height: 15, color: 'var(--ink-soft)', flexShrink: 0 }} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>
        Desde
        <input type="date" value={desde} max={hasta || undefined} onChange={e => setDesde(e.target.value)} style={inp} />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>
        Hasta
        <input type="date" value={hasta} min={desde || undefined} onChange={e => setHasta(e.target.value)} style={inp} />
      </label>
      <a href={hrefPedidos} download title="Detalle de cada pedido del rango">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, padding: '9px 15px', borderRadius: 'var(--r-pill)', background: 'var(--orange)', color: '#fff', boxShadow: '0 6px 16px rgba(217,113,30,.28)', cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} />
          Pedidos
        </span>
      </a>
      <a href={hrefContable} download title="Resumen diario para el contador: ventas, métodos de pago, costos, gastos y utilidad por día">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, padding: '9px 15px', borderRadius: 'var(--r-pill)', background: 'var(--choco-900)', color: '#fff', cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} />
          Contable
        </span>
      </a>
      <button
        onClick={() => setOpen(false)}
        aria-label="Cerrar exportación"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', display: 'grid', placeItems: 'center', padding: 4 }}
      >
        <X style={{ width: 15, height: 15 }} />
      </button>
    </div>
  );
}
