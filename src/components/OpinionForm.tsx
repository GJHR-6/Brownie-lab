"use client";

import { useState, useActionState } from "react";
import { enviarOpinion } from "@/actions/resenas";
import type { ActionResult } from "@/types/actions";

const ESTRELLAS_LABEL = ["", "★", "★★", "★★★", "★★★★", "★★★★★"];

export default function OpinionForm({ productoId, productoNombre }: { productoId?: string; productoNombre?: string }) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(enviarOpinion as never, null);
  const [tipo, setTipo] = useState<"producto" | "general">(productoId ? "producto" : "general");

  if (state?.success) {
    return (
      <div style={{ background: "var(--cream)", border: "1px solid var(--hairline)", borderRadius: "var(--r-md)", padding: "16px 18px", fontSize: 14, color: "var(--ink-soft)" }}>
        ¡Gracias por tu opinión! Se publicará después de ser revisada. 🍫
      </div>
    );
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 }}>
      <input type="hidden" name="producto_id" value={productoId ?? ""} />
      {state?.success === false && (
        <div style={{ background: "#fdf0f0", border: "1px solid #e6c4c8", borderRadius: "var(--r-md)", padding: "11px 14px", fontSize: 13, color: "var(--berry)" }}>{state.error}</div>
      )}
      {productoId && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>¿De qué se trata tu opinión?</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2" style={{ fontSize: 14, color: "var(--ink)", cursor: "pointer" }}>
              <input type="radio" name="tipo" value="producto" checked={tipo === "producto"} onChange={() => setTipo("producto")} disabled={isPending}
                style={{ accentColor: "var(--orange)" }} />
              Reseña de {productoNombre}
            </label>
            <label className="flex items-center gap-2" style={{ fontSize: 14, color: "var(--ink)", cursor: "pointer" }}>
              <input type="radio" name="tipo" value="general" checked={tipo === "general"} onChange={() => setTipo("general")} disabled={isPending}
                style={{ accentColor: "var(--orange)" }} />
              Testimonio general sobre Brownie Lab
            </label>
          </div>
        </div>
      )}
      {!productoId && <input type="hidden" name="tipo" value="general" />}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Tu nombre</label>
        <input name="autor" required maxLength={80} disabled={isPending} placeholder="María López"
          style={{ border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)", padding: "11px 14px", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink)", background: "var(--paper-card)", outline: "none", opacity: isPending ? 0.6 : 1 }}
          onFocus={e => (e.target.style.borderColor = "var(--orange)")}
          onBlur={e => (e.target.style.borderColor = "var(--hairline)")} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Calificación</label>
        <select name="estrellas" defaultValue="5" disabled={isPending} className="bl-select"
          style={{ border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)", padding: "11px 14px", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink)", background: "var(--paper-card)", outline: "none", opacity: isPending ? 0.6 : 1 }}
          onFocus={e => (e.target.style.borderColor = "var(--orange)")}
          onBlur={e => (e.target.style.borderColor = "var(--hairline)")}>
          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{ESTRELLAS_LABEL[n]} ({n})</option>)}
        </select>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Tu comentario</label>
        <textarea name="texto" required rows={3} maxLength={600} disabled={isPending}
          placeholder={tipo === "producto" ? "¿Qué te pareció este producto?" : "¿Qué te pareció Brownie Lab?"}
          style={{ border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)", padding: "11px 14px", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink)", background: "var(--paper-card)", outline: "none", resize: "vertical", minHeight: 88, lineHeight: 1.6, opacity: isPending ? 0.6 : 1 }}
          onFocus={e => (e.target.style.borderColor = "var(--orange)")}
          onBlur={e => (e.target.style.borderColor = "var(--hairline)")} />
      </div>
      <button type="submit" disabled={isPending}
        className="inline-flex items-center justify-center gap-2 font-bold text-[15px] py-3.5 rounded-full border-0 cursor-pointer text-white transition-all"
        style={{ background: "var(--orange)", boxShadow: "0 6px 18px rgba(217,113,30,.28)", opacity: isPending ? 0.7 : 1 }}>
        {isPending ? "Enviando…" : "Enviar opinión"}
      </button>
    </form>
  );
}
