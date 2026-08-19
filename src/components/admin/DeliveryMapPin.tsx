'use client';

import { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

interface Props {
  lat: number;
  lng: number;
}

export default function DeliveryMapPin({ lat, lng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<{ map: L.Map } | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    import('leaflet').then(L => {
      if (!mapRef.current || leafletRef.current) return;

      // Fix default icon path broken by bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomControl: false,
      }).setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.marker([lat, lng]).addTo(map);

      leafletRef.current = { map };
    });

    return () => {
      leafletRef.current?.map.remove();
      leafletRef.current = null;
    };
    // Solo lectura: se centra una vez con las coords iniciales.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ marginTop: 10 }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div
        ref={mapRef}
        style={{ height: 180, width: '100%', borderRadius: 'var(--r-md)', border: '1px solid var(--hairline)' }}
      />
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--orange)', textDecoration: 'none' }}
      >
        Abrir en Google Maps
        <ExternalLink style={{ width: 12, height: 12 }} />
      </a>
    </div>
  );
}
