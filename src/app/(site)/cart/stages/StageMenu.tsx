"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, ShoppingBag, Store, Clock, MapPin, ChevronDown } from "lucide-react";
import { getProductos } from "@/actions/productos";
import { getConfiguracionEnvio, getEnvioModo, getConfiguracionPedidos } from "@/actions/publico";
import { getDeliveryZonesPublicas } from "@/actions/deliveryZones";
import { useCartStore } from "@/lib/cartStore";
import ProductCard from "@/components/ProductCard";
import BagDrawer from "../BagDrawer";
import StoreLocator from "../StoreLocator";
import LocationMapPicker from "../LocationMapPicker";
import { fechaMinimaEntrega, CONFIG_PEDIDOS_DEFAULT, type ConfigPedidos } from "@/lib/horarios";
import type { Producto } from "@/types/database";
import type { DeliveryZone } from "@/types/database";
import type { SedeEnvio } from "@/lib/envio";
import type { FlowSelection } from "../PedidoFlow";

export default function StageMenu({
  selection, onBack, onSelectSedePickup, onSelectZona, onSelectCoords, onContinue, onSignIn, onSetFechaHora,
}: {
  selection: FlowSelection;
  onBack: () => void;
  onSelectSedePickup: (sede: string) => void;
  onSelectZona: (zonaId: string) => void;
  onSelectCoords: (coords: { lat: number; lng: number }) => void;
  onContinue: (giftCardCodigo: string | null) => void;
  onSignIn: () => void;
  onSetFechaHora: (fecha: string | null, hora: string | null) => void;
}) {
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [sedes, setSedes] = useState<SedeEnvio[]>([]);
  const [zonas, setZonas] = useState<DeliveryZone[] | null>(null);
  const [envioModo, setEnvioModo] = useState<"distancia" | "zonas">("distancia");
  const [cfgPedidos, setCfgPedidos] = useState<ConfigPedidos>(CONFIG_PEDIDOS_DEFAULT);
  const [bagOpen, setBagOpen] = useState(false);
  const [cambiandoSede, setCambiandoSede] = useState(false);
  const [fechaHoraOpen, setFechaHoraOpen] = useState(false);
  const [fechaHoraError, setFechaHoraError] = useState(false);
  const itemCount = useCartStore(s => s.itemCount());

  const faltaFechaHora = selection.tipoEntrega === "pickup" && !!selection.sedePickup
    && (!selection.fechaEntrega || !selection.horaEntrega);

  useEffect(() => {
    getProductos().then(setProductos).catch(() => setProductos([]));
    getConfiguracionEnvio().then(cfg => setSedes(cfg.sedes));
    getEnvioModo().then(setEnvioModo);
    getConfiguracionPedidos().then(setCfgPedidos).catch(() => {});
  }, []);

  useEffect(() => {
    if (selection.tipoEntrega === "domicilio" && envioModo === "zonas" && zonas === null) {
      getDeliveryZonesPublicas().then(setZonas).catch(() => setZonas([]));
    }
  }, [selection.tipoEntrega, envioModo, zonas]);

  const needsSede   = selection.tipoEntrega === "pickup" && !selection.sedePickup;
  const needsZona   = selection.tipoEntrega === "domicilio" && envioModo === "zonas" && !selection.zonaId;
  const needsCoords = selection.tipoEntrega === "domicilio" && envioModo === "distancia" && !selection.coordsCliente;

  if (needsSede || cambiandoSede) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-12">
        <BackBtn onBack={cambiandoSede ? () => setCambiandoSede(false) : onBack} />
        <Title>Elige tu sede</Title>
        {sedes.length === 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>Cargando sedes…</p>
        ) : (
          <StoreLocator sedes={sedes} onSelect={(sede) => { onSelectSedePickup(sede); setCambiandoSede(false); }} />
        )}
      </div>
    );
  }

  if (needsCoords) {
    return <CoordsStep onBack={onBack} onConfirm={onSelectCoords} />;
  }

  if (needsZona) {
    return (
      <div className="max-w-md mx-auto px-5 py-12">
        <BackBtn onBack={onBack} />
        <Title>Elige tu zona de entrega</Title>
        <div className="flex flex-col gap-3">
          {zonas === null && <p style={{ color: "var(--ink-soft)" }}>Cargando zonas…</p>}
          {zonas?.length === 0 && <p style={{ color: "var(--ink-soft)" }}>No hay zonas de envío disponibles.</p>}
          {zonas?.map(z => (
            <button key={z.id} onClick={() => onSelectZona(z.id)} className="text-left cursor-pointer border-0"
              style={{ ...pickerStyle, justifyContent: "space-between" }}>
              <span>
                <span className="font-semibold block" style={{ color: "var(--ink)" }}>{z.nombre}</span>
                {z.descripcion && <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>{z.descripcion}</span>}
              </span>
              <span className="font-bold" style={{ color: "var(--orange-ink)" }}>L.{Number(z.tarifa).toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const grouped = (productos ?? []).reduce<Record<string, Producto[]>>((acc, p) => {
    const key = p.categoria || "Otros";
    (acc[key] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-5 py-10 pb-28">
      <div className="flex items-center justify-between mb-5">
        <BackBtn onBack={onBack} />
      </div>

      {selection.tipoEntrega === "pickup" && selection.sedePickup && (
        <>
          <OrderBar
            sede={selection.sedePickup}
            fechaEntrega={selection.fechaEntrega}
            horaEntrega={selection.horaEntrega}
            cfgPedidos={cfgPedidos}
            open={fechaHoraOpen}
            onOpenChange={setFechaHoraOpen}
            onSetFechaHora={(fecha, hora) => { onSetFechaHora(fecha, hora); if (fecha && hora) setFechaHoraError(false); }}
            onChangeSede={() => setCambiandoSede(true)}
            highlight={fechaHoraError}
          />
          {fechaHoraError && (
            <p className="mb-5" style={{ color: "var(--berry)", fontSize: 13.5 }}>Elige fecha y hora de recogida antes de continuar.</p>
          )}
        </>
      )}

      {productos === null && (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: "var(--orange-ink)" }} /></div>
      )}

      {productos !== null && Object.entries(grouped).map(([cat, prods]) => (
        <section key={cat} className="mb-10">
          <h2 className="font-bold mb-4 capitalize" style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: 22, color: "var(--ink)" }}>
            {cat}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {prods.filter(p => p.disponible).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ))}

      <button onClick={() => setBagOpen(true)}
        className="fixed bottom-6 right-6 inline-flex items-center gap-2.5 font-bold cursor-pointer border-0 text-white z-40"
        style={{ background: "var(--orange)", borderRadius: "var(--r-pill)", padding: "15px 22px", fontSize: 15.5, boxShadow: "0 8px 22px rgba(217,113,30,.38)" }}
      >
        <ShoppingBag size={19} />
        Ver bolsa {itemCount > 0 && `(${itemCount})`}
      </button>

      {bagOpen && (
        <BagDrawer
          telefono={selection.telefono}
          onClose={() => setBagOpen(false)}
          onContinue={(giftCardCodigo) => {
            if (faltaFechaHora) {
              setBagOpen(false);
              setFechaHoraOpen(true);
              setFechaHoraError(true);
              return;
            }
            setBagOpen(false);
            onContinue(giftCardCodigo);
          }}
          onSignIn={() => { setBagOpen(false); onSignIn(); }}
        />
      )}
    </div>
  );
}

function OrderBar({
  sede, fechaEntrega, horaEntrega, cfgPedidos, open, onOpenChange, onSetFechaHora, onChangeSede, highlight,
}: {
  sede: string;
  fechaEntrega: string | null;
  horaEntrega: string | null;
  cfgPedidos: ConfigPedidos;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetFechaHora: (fecha: string | null, hora: string | null) => void;
  onChangeSede: () => void;
  highlight?: boolean;
}) {
  const [fechaDraft, setFechaDraft] = useState(fechaEntrega ?? "");
  const [horaDraft, setHoraDraft] = useState(horaEntrega ?? "");

  const fechaLabel = fechaEntrega
    ? new Date(`${fechaEntrega}T00:00:00`).toLocaleDateString("es-HN", { weekday: "short", day: "numeric", month: "short" })
    : "Elige fecha";

  return (
    <div className="flex flex-wrap items-stretch gap-2 mb-2" style={{ position: "relative" }}>
      <div className="inline-flex items-center gap-2 rounded-full px-4 h-10" style={{ background: "var(--cream)", color: "var(--ink)", fontSize: 13.5, fontWeight: 600 }}>
        <Store size={15} style={{ color: "var(--orange-ink)" }} /> Retiro en tienda
      </div>

      <button
        onClick={() => onOpenChange(!open)}
        className="inline-flex items-center gap-2 rounded-full px-4 h-10 cursor-pointer"
        style={{
          background: "var(--paper-card)",
          border: `1.5px solid ${highlight ? "var(--berry)" : "var(--hairline)"}`,
          color: "var(--ink)", fontSize: 13.5, fontWeight: 600,
        }}
      >
        <Clock size={15} style={{ color: highlight ? "var(--berry)" : "var(--orange-ink)" }} />
        {fechaLabel}{horaEntrega ? ` · ${horaEntrega}` : ""}
        <ChevronDown size={14} style={{ color: "var(--ink-soft)" }} />
      </button>

      <button
        onClick={onChangeSede}
        className="inline-flex items-center gap-2 rounded-full px-4 h-10 cursor-pointer border-0"
        style={{ background: "var(--paper-card)", border: "1.5px solid var(--hairline)", color: "var(--ink)", fontSize: 13.5, fontWeight: 600 }}
      >
        <MapPin size={15} style={{ color: "var(--orange-ink)" }} />
        {sede}
        <ChevronDown size={14} style={{ color: "var(--ink-soft)" }} />
      </button>

      {open && (
        <div className="absolute top-12 left-0 z-30 p-4 rounded-2xl"
          style={{ background: "var(--paper-card)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-md, 0 8px 24px rgba(0,0,0,.12))", width: 280 }}>
          <p className="font-semibold mb-3" style={{ color: "var(--ink)", fontSize: 14 }}>Fecha y hora de recogida</p>
          <label className="block font-semibold mb-1.5" style={{ color: "var(--ink-soft)", fontSize: 12.5 }}>Fecha</label>
          <input type="date" value={fechaDraft} min={fechaMinimaEntrega(cfgPedidos.hora_corte)}
            onChange={e => setFechaDraft(e.target.value)}
            className="w-full mb-3" style={{ padding: "9px 12px", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)", fontSize: 14 }} />
          <label className="block font-semibold mb-1.5" style={{ color: "var(--ink-soft)", fontSize: 12.5 }}>Hora</label>
          <select value={horaDraft} onChange={e => setHoraDraft(e.target.value)}
            className="w-full mb-4" style={{ padding: "9px 12px", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)", fontSize: 14 }}>
            <option value="">Elige una hora</option>
            {cfgPedidos.horas_entrega.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <button
            disabled={!fechaDraft || !horaDraft}
            onClick={() => { onSetFechaHora(fechaDraft, horaDraft); onOpenChange(false); }}
            className="w-full font-bold cursor-pointer border-0 text-white"
            style={{ background: "var(--orange)", borderRadius: "var(--r-pill)", padding: "10px", fontSize: 14, opacity: (!fechaDraft || !horaDraft) ? 0.5 : 1 }}
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}

function CoordsStep({ onBack, onConfirm }: { onBack: () => void; onConfirm: (c: { lat: number; lng: number }) => void }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  return (
    <div className="max-w-lg mx-auto px-5 py-12">
      <BackBtn onBack={onBack} />
      <Title>¿Dónde te entregamos?</Title>
      <p className="mb-4" style={{ color: "var(--ink-soft)", fontSize: 14 }}>
        Usa tu ubicación o toca el mapa para colocar el pin en tu dirección de entrega.
      </p>
      <LocationMapPicker coords={coords} onChange={setCoords} />
      <button
        disabled={!coords}
        onClick={() => coords && onConfirm(coords)}
        className="mt-4 w-full font-bold border-0 text-white"
        style={{
          background: "var(--orange)", borderRadius: "var(--r-pill)", padding: "13px",
          fontSize: 15, opacity: !coords ? 0.45 : 1, cursor: !coords ? "not-allowed" : "pointer",
        }}
      >
        Confirmar ubicación
      </button>
    </div>
  );
}

function BackBtn({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} className="inline-flex items-center gap-1.5 mb-6 border-0 bg-transparent cursor-pointer" style={{ color: "var(--ink-soft)", fontSize: 14 }}>
      <ArrowLeft size={15} /> Volver
    </button>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-bold mb-6" style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: 26, color: "var(--ink)" }}>
      {children}
    </h2>
  );
}

const pickerStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12,
  background: "var(--paper-card)", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)",
  padding: "16px 18px", fontSize: 15,
};
