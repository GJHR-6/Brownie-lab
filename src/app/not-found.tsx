import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-7xl mb-6">🍪</div>
      <h1
        className="text-4xl font-bold text-amber-800 mb-3"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Página no encontrada
      </h1>
      <p className="text-stone-500 text-lg mb-2">
        Esta página no existe o se nos quemó en el horno.
      </p>
      <p className="text-stone-400 text-sm mb-10">Error 404</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="inline-block bg-amber-800 text-white font-semibold px-8 py-3 rounded-full hover:bg-amber-700 transition-colors"
        >
          Volver al inicio
        </Link>
        <Link
          href="/menu"
          className="inline-block border-2 border-amber-800 text-amber-800 font-semibold px-8 py-3 rounded-full hover:bg-amber-50 transition-colors"
        >
          Ver menú
        </Link>
      </div>
    </div>
  );
}
