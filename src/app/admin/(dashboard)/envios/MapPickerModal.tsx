'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Check, MapPin } from 'lucide-react';

interface Props {
  initialLat?: number;
  initialLng?: number;
  sedeName: string;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}

// Honduras center as default
const DEFAULT_LAT = 15.1;
const DEFAULT_LNG = -86.8;
const DEFAULT_ZOOM = 7;

export default function MapPickerModal({ initialLat, initialLng, sedeName, onConfirm, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<{ map: L.Map; marker: L.Marker } | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    // Dynamic import to avoid SSR
    import('leaflet').then(L => {
      // Fix default icon path broken by bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const startLat = initialLat ?? DEFAULT_LAT;
      const startLng = initialLng ?? DEFAULT_LNG;
      const startZoom = initialLat ? 14 : DEFAULT_ZOOM;

      const map = L.map(mapRef.current!).setView([startLat, startLng], startZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(
        initialLat && initialLng ? [initialLat, initialLng] : [startLat, startLng],
        { draggable: true }
      );

      if (initialLat && initialLng) marker.addTo(map);

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        setCoords({ lat, lng });
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]).addTo(map);
        setCoords({ lat, lng });
      });

      leafletRef.current = { map, marker };
    });

    return () => {
      leafletRef.current?.map.remove();
      leafletRef.current = null;
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trap keyboard: Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,10,.55)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div role="dialog" aria-modal="true" aria-label={`Seleccionar ubicación — ${sedeName}`}
          style={{ background: 'var(--paper)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper-card)', flexShrink: 0 }}>
            <MapPin style={{ width: 18, height: 18, color: 'var(--orange)' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', margin: 0 }}>Seleccionar ubicación</p>
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>{sedeName} — haz clic en el mapa para colocar el marcador</p>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Map */}
          <div ref={mapRef} style={{ height: 420, width: '100%' }} />

          {/* Footer */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--hairline)', background: 'var(--paper-card)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {coords ? (
              <p style={{ flex: 1, fontSize: 12.5, fontFamily: 'ui-monospace,monospace', color: 'var(--ink-soft)', margin: 0 }}>
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            ) : (
              <p style={{ flex: 1, fontSize: 12.5, color: 'var(--ink-soft)', margin: 0 }}>Haz clic en el mapa para colocar el pin</p>
            )}
            <button type="button" onClick={onClose}
              style={{ fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--hairline)', cursor: 'pointer', background: 'var(--paper-card)', color: 'var(--ink)' }}>
              Cancelar
            </button>
            <button type="button" disabled={!coords} onClick={() => coords && onConfirm(coords.lat, coords.lng)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid transparent', cursor: coords ? 'pointer' : 'not-allowed', background: 'var(--orange)', color: '#fff', opacity: coords ? 1 : 0.45 }}>
              <Check style={{ width: 14, height: 14 }} />
              Confirmar ubicación
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
