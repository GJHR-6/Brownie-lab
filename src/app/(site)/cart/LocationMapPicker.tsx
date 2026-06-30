"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, LocateFixed } from "lucide-react";

interface Props {
  coords: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
}

const DEFAULT_LAT = 15.1;
const DEFAULT_LNG = -86.8;
const DEFAULT_ZOOM = 12;

export default function LocationMapPicker({ coords, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<{ map: L.Map; marker: L.Marker } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    import("leaflet").then(L => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const startLat = coords?.lat ?? DEFAULT_LAT;
      const startLng = coords?.lng ?? DEFAULT_LNG;

      const map = L.map(mapRef.current!).setView([startLat, startLng], coords ? 15 : DEFAULT_ZOOM);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([startLat, startLng], { draggable: true });
      if (coords) marker.addTo(map);

      marker.on("dragend", () => {
        const latlng = marker.getLatLng();
        onChange({ lat: latlng.lat, lng: latlng.lng });
      });

      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng).addTo(map);
        onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      instanceRef.current = { map, marker };
    });

    return () => {
      instanceRef.current?.map.remove();
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!coords || !instanceRef.current) return;
    const { map, marker } = instanceRef.current;
    marker.setLatLng([coords.lat, coords.lng]).addTo(map);
    map.setView([coords.lat, coords.lng], 16);
  }, [coords]);

  function handleGps() {
    if (!("geolocation" in navigator)) {
      setGpsError("Tu navegador no soporta geolocalización.");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      pos => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setGpsError("No pudimos obtener tu ubicación. Activa el permiso e intenta de nuevo.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1.5px solid var(--hairline)" }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ background: "var(--cream)", borderBottom: "1px solid var(--hairline)" }}>
        <button
          type="button"
          onClick={handleGps}
          disabled={gpsLoading}
          className="inline-flex items-center gap-2 font-bold text-[13.5px] px-4 py-2 rounded-full cursor-pointer border-0"
          style={{
            background: coords ? "rgba(31,138,91,.12)" : "var(--orange)",
            color: coords ? "var(--green, #157a4d)" : "#fff",
          }}
        >
          {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          {coords ? "Ubicación detectada ✓" : "Calcular mi ubicación"}
        </button>
        <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>
          o toca el mapa para colocar el pin
        </span>
      </div>

      <div ref={mapRef} style={{ height: 300, width: "100%" }} />

      {gpsError && (
        <p className="px-4 py-2.5 text-[12.5px]" style={{ color: "var(--berry)", background: "var(--paper-card)", borderTop: "1px solid var(--hairline)" }}>
          {gpsError}
        </p>
      )}
    </div>
  );
}
