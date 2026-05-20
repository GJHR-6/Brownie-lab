"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Producto } from "@/types/database";

const LABELS: Record<string, string> = {
  clasicas: "Clásicas",
  brownies: "Brownies",
  especiales: "Especiales",
};

interface MenuClientProps {
  productos: Producto[];
}

export default function MenuClient({ productos }: MenuClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [...new Set(productos.map((p) => p.categoria))];

  const filtered = activeCategory
    ? productos.filter((p) => p.categoria === activeCategory)
    : productos;

  const grouped = filtered.reduce<Record<string, Producto[]>>((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = [];
    acc[p.categoria].push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1
          className="text-4xl md:text-5xl font-bold text-amber-800 mb-3"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Nuestro Menú
        </h1>
        <p className="text-stone-500 text-lg">
          Todo hecho a mano. Pedidos con 24h de anticipación.
        </p>
      </div>

      <div className="flex gap-2 mb-12 flex-wrap justify-center">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
            activeCategory === null
              ? "bg-amber-800 text-white"
              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeCategory === cat
                ? "bg-amber-800 text-white"
                : "bg-amber-100 text-amber-800 hover:bg-amber-200"
            }`}
          >
            {LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2
              className="text-2xl font-bold text-amber-800"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {LABELS[category] ?? category}
            </h2>
            <div className="flex-1 h-px bg-amber-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}

      {productos.length === 0 && (
        <div className="text-center py-20 text-stone-400">
          <p className="text-5xl mb-4">🍪</p>
          <p>El menú está en preparación. Vuelve pronto.</p>
        </div>
      )}
    </div>
  );
}
