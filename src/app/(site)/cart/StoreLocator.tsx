"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, ChevronRight } from "lucide-react";
import type { SedeEnvio } from "@/lib/envio";

const DEFAULT_LAT = 15.1;
const DEFAULT_LNG = -86.8;
const DEFAULT_ZOOM = 12;

export default function StoreLocator({
  sedes, onSelect,
}: {
  sedes: SedeEnvio[];
  onSelect: (nombre: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<{ map: L.Map; markers: Map<string, L.Marker> } | null>(null);
  const [query, setQuery] = useState("");
  const [activeSede, setActiveSede] = useState<string | null>(null);

  const filtered = sedes.filter(s => s.nombre.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!mapRef.current || leafletRef.current || sedes.length === 0) return;

    import("leaflet").then(L => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const avgLat = sedes.reduce((s, x) => s + x.lat, 0) / sedes.length || DEFAULT_LAT;
      const avgLng = sedes.reduce((s, x) => s + x.lng, 0) / sedes.length || DEFAULT_LNG;

      const map = L.map(mapRef.current!).setView([avgLat, avgLng], DEFAULT_ZOOM);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const markers = new Map<string, L.Marker>();
      for (const sede of sedes) {
        const marker = L.marker([sede.lat, sede.lng]).addTo(map);
        marker.bindPopup(sede.nombre);
        marker.on("click", () => setActiveSede(sede.nombre));
        markers.set(sede.nombre, marker);
      }

      leafletRef.current = { map, markers };
    });

    return () => {
      leafletRef.current?.map.remove();
      leafletRef.current = null;
    };
  }, [sedes]);

  useEffect(() => {
    if (!activeSede || !leafletRef.current) return;
    const { map, markers } = leafletRef.current;
    const marker = markers.get(activeSede);
    if (marker) {
      map.setView(marker.getLatLng(), 15);
      marker.openPopup();
    }
  }, [activeSede]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="flex flex-col md:flex-row gap-5">
        <div ref={mapRef} className="w-full md:w-1/2 rounded-2xl overflow-hidden" style={{ height: 420, border: "1.5px solid var(--hairline)" }} />

        <div className="w-full md:w-1/2 flex flex-col" style={{ maxHeight: 420 }}>
          <div className="relative flex items-center mb-3 flex-shrink-0">
            <Search size={16} className="absolute left-4" style={{ color: "var(--ink-soft)" }} />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar sede…"
              className="w-full outline-none"
              style={{ padding: "11px 14px 11px 38px", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)", background: "var(--paper-card)", fontSize: 14.5, color: "var(--ink)" }}
            />
          </div>

          <div className="flex flex-col gap-2.5 overflow-y-auto">
            {filtered.length === 0 && (
              <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>No hay sedes que coincidan.</p>
            )}
            {filtered.map(s => (
              <button
                key={s.nombre}
                onClick={() => { setActiveSede(s.nombre); onSelect(s.nombre); }}
                onMouseEnter={() => setActiveSede(s.nombre)}
                className="flex items-center gap-3 text-left cursor-pointer border-0"
                style={{
                  background: activeSede === s.nombre ? "var(--cream)" : "var(--paper-card)",
                  border: `1.5px solid ${activeSede === s.nombre ? "var(--amber)" : "var(--hairline)"}`,
                  borderRadius: "var(--r-md)",
                  padding: "14px 16px",
                }}
              >
                <MapPin size={18} style={{ color: "var(--orange-ink)", flexShrink: 0 }} />
                <span className="flex-1">
                  <span className="font-semibold block" style={{ color: "var(--ink)", fontSize: 15 }}>{s.nombre}</span>
                </span>
                <ChevronRight size={16} style={{ color: "var(--ink-soft)" }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
