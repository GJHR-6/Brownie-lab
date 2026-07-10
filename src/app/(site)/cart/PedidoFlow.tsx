"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cartStore";
import StageStart from "./stages/StageStart";
import StageSignIn from "./stages/StageSignIn";
import StageCajas from "./stages/StageCajas";
import StageMenu from "./stages/StageMenu";
import StageGiftCard from "./stages/StageGiftCard";
import StageCatering from "./stages/StageCatering";
import StageReview from "./stages/StageReview";
import type { CajaBuilderData } from "@/components/caja/types";

export type TipoEntrega = "pickup" | "domicilio";
export type Stage = "start" | "signin" | "stores" | "address" | "cajas" | "menu" | "giftcard" | "catering" | "review";

export interface FlowSelection {
  stage: Stage;
  tipoEntrega: TipoEntrega | null;
  telefono: string | null;
  sedePickup: string | null;
  zonaId: string | null;
  coordsCliente: { lat: number; lng: number } | null;
  giftCardCodigo: string | null;
  fechaEntrega: string | null;
  horaEntrega: string | null;
}

const SESSION_KEY = "brownielab-pedido-flow";

const INITIAL: FlowSelection = {
  stage: "start",
  tipoEntrega: null,
  telefono: null,
  sedePickup: null,
  zonaId: null,
  coordsCliente: null,
  giftCardCodigo: null,
  fechaEntrega: null,
  horaEntrega: null,
};

export default function PedidoFlow({ builderData }: { builderData: CajaBuilderData }) {
  const [sel, setSel] = useState<FlowSelection>(INITIAL);
  const [hydrated, setHydrated] = useState(false);
  const itemCount = useCartStore(s => s.itemCount());

  // Flujo estilo Crumbl: con la ubicación resuelta y la bolsa vacía, la
  // primera pantalla de pedido es elegir caja; con items ya en la bolsa
  // (landing, ProductCard) se va directo al menú.
  const destinoTrasUbicacion: Stage =
    builderData.cajas.length > 0 && itemCount === 0 ? "cajas" : "menu";

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (raw) setSel({ ...INITIAL, ...JSON.parse(raw) });
      } catch { /* ignore */ }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(sel)); } catch { /* ignore */ }
  }, [sel, hydrated]);

  function update(patch: Partial<FlowSelection>) {
    setSel(prev => ({ ...prev, ...patch }));
  }

  function goToStage(stage: Stage) {
    update({ stage });
  }

  if (!hydrated) return null;

  switch (sel.stage) {
    case "start":
      return (
        <StageStart
          onPickup={() => update({ tipoEntrega: "pickup", sedePickup: null, stage: "stores" })}
          onDomicilio={() => update({ tipoEntrega: "domicilio", zonaId: null, stage: sel.telefono ? "address" : "signin" })}
          onGiftCard={() => goToStage("giftcard")}
          onCatering={() => goToStage("catering")}
        />
      );
    case "signin": {
      const yaEligioDestino = !!(sel.sedePickup || sel.zonaId);
      return (
        <StageSignIn
          onVerified={(telefono) => update({
            telefono,
            stage: yaEligioDestino ? "menu" : (sel.tipoEntrega === "domicilio" ? "address" : "stores"),
          })}
          onBack={() => goToStage(yaEligioDestino ? "menu" : "start")}
        />
      );
    }
    case "cajas":
      return (
        <StageCajas
          builderData={builderData}
          onBack={() => goToStage("start")}
          onSkip={() => goToStage("menu")}
          onBoxAdded={() => goToStage("menu")}
        />
      );
    case "stores":
    case "address":
    case "menu":
      return (
        <StageMenu
          selection={sel}
          onBack={() => goToStage("start")}
          onSelectSedePickup={(sedePickup) => update({ sedePickup, stage: destinoTrasUbicacion })}
          onSelectZona={(zonaId) => update({ zonaId, stage: destinoTrasUbicacion })}
          onSelectCoords={(coordsCliente) => update({ coordsCliente, stage: destinoTrasUbicacion })}
          onContinue={(giftCardCodigo) => update({ giftCardCodigo, stage: "review" })}
          onSignIn={() => goToStage("signin")}
          onSetFechaHora={(fechaEntrega, horaEntrega) => update({ fechaEntrega, horaEntrega })}
          onArmarCaja={builderData.cajas.length > 0 ? () => goToStage("cajas") : undefined}
        />
      );
    case "giftcard":
      return <StageGiftCard onBack={() => goToStage("start")} />;
    case "catering":
      return <StageCatering onBack={() => goToStage("start")} />;
    case "review":
      return (
        <StageReview
          selection={sel}
          onBack={() => goToStage("menu")}
          onDone={() => setSel(INITIAL)}
        />
      );
    default:
      return null;
  }
}
