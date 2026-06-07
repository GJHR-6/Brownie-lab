import type { Metadata } from "next";
import Link from "next/link";
import BLIcon from "@/components/BLIcon";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: "Esta página no existe o se nos quemó en el horno.",
};

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center min-h-[70vh]"
      style={{ paddingInline: "var(--gutter)", paddingBlock: "clamp(60px, 10vw, 120px)" }}
    >
      {/* Icon */}
      <div
        className="w-28 h-28 rounded-full grid place-items-center mb-8 text-[56px]"
        style={{ background: "var(--cream)" }}
        aria-hidden="true"
      >
        🍪
      </div>

      {/* Headline */}
      <p
        className="text-[11px] font-bold tracking-[.2em] uppercase mb-3"
        style={{ color: "var(--orange)" }}
      >
        Error 404
      </p>
      <h1
        className="font-extrabold mb-4"
        style={{
          fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
          fontSize: "clamp(30px, 5vw, 52px)",
          color: "var(--ink)",
        }}
      >
        Esta página se quemó en el horno
      </h1>
      <p
        className="mb-10 mx-auto"
        style={{ color: "var(--ink-soft)", fontSize: 17, maxWidth: "38ch" }}
      >
        La página que buscás no existe o fue removida. Pero nuestros brownies sí existen — y están deliciosos.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-full text-white no-underline transition-colors"
          style={{ background: "var(--orange)", boxShadow: "0 6px 18px rgba(217,113,30,.32)" }}
        >
          <BLIcon name="brownie" size={16} />
          Ver el menú
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-full no-underline transition-colors"
          style={{
            background: "var(--paper-card)",
            color: "var(--ink)",
            border: "1.5px solid var(--hairline)",
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
