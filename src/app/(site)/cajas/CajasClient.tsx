"use client";

// Página standalone "Arma tu caja": hero + CajaBuilder compartido.
// El núcleo del armador vive en src/components/caja/ (compartido con /cart).

import Link from "next/link";
import { useRouter } from "next/navigation";
import BLIcon from "@/components/BLIcon";
import CajaBuilder from "@/components/caja/CajaBuilder";
import type { CajaBuilderData } from "@/components/caja/types";

export default function CajasClient({ data }: { data: CajaBuilderData }) {
  const router = useRouter();

  // ── Sin cajas configuradas ──
  if (data.cajas.length === 0) {
    return (
      <section className="text-center" style={{ paddingBlock: "clamp(64px, 10vw, 120px)" }}>
        <p className="text-[17px]" style={{ color: "var(--ink-soft)" }}>
          Las cajas estarán disponibles muy pronto.
        </p>
        <Link href="/menu" className="inline-flex items-center gap-2 font-bold text-[15px] no-underline mt-4" style={{ color: "var(--orange-ink)" }}>
          Ver menú completo
          <BLIcon name="arrow-right" size={16} />
        </Link>
      </section>
    );
  }

  return (
    <>
      {/* ── Page header ── */}
      <section
        className="text-center"
        style={{
          color: "var(--on-dark)",
          background: "radial-gradient(110% 120% at 85% -10%, rgba(232,162,58,.25), transparent 55%), linear-gradient(150deg, var(--choco-900) 0%, var(--choco-700) 100%)",
          paddingBlock: "clamp(48px, 7vw, 76px)",
        }}
      >
        <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
          <span className="inline-flex items-center gap-2 justify-center text-[12px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--amber)" }}>
            <BLIcon name="sparkle" size={15} />
            Ahorra en combo
          </span>
          <h1 className="font-extrabold mt-4 mb-3" style={{ fontSize: "clamp(40px, 6vw, 68px)", color: "var(--on-dark)" }}>
            Arma tu caja
          </h1>
          <p style={{ color: "var(--on-dark-soft)", fontSize: "clamp(16px, 1.4vw, 19px)", maxWidth: "46ch", marginInline: "auto" }}>
            Elige el tamaño, llénala con postres del menú o personalizados, y el descuento se aplica solo.
          </p>
        </div>
      </section>

      {/* ── Builder compartido ── */}
      <CajaBuilder
        data={data}
        addLabel="Agregar caja al carrito"
        onAdded={() => router.push("/cart")}
      />

      {/* ── Back link ── */}
      <div className="text-center" style={{ paddingBottom: "clamp(40px,5vw,64px)" }}>
        <Link href="/menu" className="inline-flex items-center gap-2 font-bold text-[15px] no-underline" style={{ color: "var(--orange-ink)" }}>
          <BLIcon name="arrow-right" size={16} className="rotate-180" />
          Ver menú completo
        </Link>
      </div>
    </>
  );
}
