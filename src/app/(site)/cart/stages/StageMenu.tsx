"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, ShoppingBag, MapPin } from "lucide-react";
import { getProductos } from "@/actions/productos";
import { getConfiguracionEnvio, getEnvioModo } from "@/actions/publico";
import { getDeliveryZonesPublicas } from "@/actions/deliveryZones";
import { useCartStore } from "@/lib/cartStore";
import ProductCard from "@/components/ProductCard";
import BagDrawer from "../BagDrawer";
import type { Producto } from "@/types/database";
import type { DeliveryZone } from "@/types/database";
import type { FlowSelection } from "../PedidoFlow";

export default function StageMenu({
  selection, onBack, onSelectSedePickup, onSelectZona, onContinue,
}: {
  selection: FlowSelection;
  onBack: () => void;
  onSelectSedePickup: (sede: string) => void;
  onSelectZona: (zonaId: string) => void;
  onContinue: (giftCardCodigo: string | null) => void;
}) {
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [sedes, setSedes] = useState<Array<{ nombre: string }>>([]);
  const [zonas, setZonas] = useState<DeliveryZone[] | null>(null);
  const [envioModo, setEnvioModo] = useState<"distancia" | "zonas">("distancia");
  const [bagOpen, setBagOpen] = useState(false);
  const itemCount = useCartStore(s => s.itemCount());

  useEffect(() => {
    getProductos().then(setProductos).catch(() => setProductos([]));
    getConfiguracionEnvio().then(cfg => setSedes(cfg.sedes));
    getEnvioModo().then(setEnvioModo);
  }, []);

  useEffect(() => {
    if (selection.tipoEntrega === "domicilio" && envioModo === "zonas" && zonas === null) {
      getDeliveryZonesPublicas().then(setZonas).catch(() => setZonas([]));
    }
  }, [selection.tipoEntrega, envioModo, zonas]);

  const needsSede = selection.tipoEntrega === "pickup" && !selection.sedePickup;
  const needsZona = selection.tipoEntrega === "domicilio" && envioModo === "zonas" && !selection.zonaId;

  if (needsSede) {
    return (
      <div className="max-w-md mx-auto px-5 py-12">
        <BackBtn onBack={onBack} />
        <Title>Elige tu sede</Title>
        <div className="flex flex-col gap-3">
          {sedes.length === 0 && <p style={{ color: "var(--ink-soft)" }}>Cargando sedes…</p>}
          {sedes.map(s => (
            <button key={s.nombre} onClick={() => onSelectSedePickup(s.nombre)} className="text-left cursor-pointer border-0"
              style={pickerStyle}>
              <MapPin size={18} style={{ color: "var(--orange-ink)" }} />
              <span className="font-semibold" style={{ color: "var(--ink)" }}>{s.nombre}</span>
            </button>
          ))}
        </div>
      </div>
    );
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
      <div className="flex items-center justify-between mb-7">
        <BackBtn onBack={onBack} />
      </div>

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
          onClose={() => setBagOpen(false)}
          onContinue={(giftCardCodigo) => { setBagOpen(false); onContinue(giftCardCodigo); }}
        />
      )}
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
