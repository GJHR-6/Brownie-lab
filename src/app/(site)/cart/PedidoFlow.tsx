"use client";

import { useEffect, useState } from "react";
import StageStart from "./stages/StageStart";
import StageSignIn from "./stages/StageSignIn";
import StageMenu from "./stages/StageMenu";
import StageGiftCard from "./stages/StageGiftCard";
import StageCatering from "./stages/StageCatering";
import StageReview from "./stages/StageReview";

export type TipoEntrega = "pickup" | "domicilio";
export type Stage = "start" | "signin" | "stores" | "address" | "menu" | "giftcard" | "catering" | "review";

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

export default function PedidoFlow() {
  const [sel, setSel] = useState<FlowSelection>(INITIAL);
  const [hydrated, setHydrated] = useState(false);

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
    case "stores":
    case "address":
    case "menu":
      return (
        <StageMenu
          selection={sel}
          onBack={() => goToStage("start")}
          onSelectSedePickup={(sedePickup) => update({ sedePickup, stage: "menu" })}
          onSelectZona={(zonaId) => update({ zonaId, stage: "menu" })}
          onSelectCoords={(coordsCliente) => update({ coordsCliente, stage: "menu" })}
          onContinue={(giftCardCodigo) => update({ giftCardCodigo, stage: "review" })}
          onSignIn={() => goToStage("signin")}
          onSetFechaHora={(fechaEntrega, horaEntrega) => update({ fechaEntrega, horaEntrega })}
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
