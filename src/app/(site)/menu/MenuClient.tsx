"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Producto, Categoria } from "@/types/database";

export default function MenuClient({ productos, categorias }: { productos: Producto[]; categorias: Categoria[] }) {
  const LABELS = Object.fromEntries(categorias.map(c => [c.slug, c.nombre]));
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const categories = [...new Set(productos.map((p) => p.categoria))];

  const filtered = (() => {
    let result = activeCategory
      ? productos.filter((p) => p.categoria === activeCategory)
      : productos;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.descripcion?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  })();

  const grouped = filtered.reduce<Record<string, Producto[]>>((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = [];
    acc[p.categoria].push(p);
    return acc;
  }, {});

  const noResults = filtered.length === 0 && (search || activeCategory);

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

      {/* Búsqueda */}
      <div className="relative max-w-sm mx-auto mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto…"
          className="w-full pl-10 pr-9 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filtros por categoría */}
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

      {/* Sin resultados */}
      {noResults ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-medium text-stone-600">Sin resultados para &ldquo;{search}&rdquo;</p>
          <button
            onClick={() => { setSearch(""); setActiveCategory(null); }}
            className="mt-4 text-amber-700 hover:underline text-sm"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
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
        ))
      )}

      {productos.length === 0 && !search && (
        <div className="text-center py-20 text-stone-400">
          <p className="text-5xl mb-4">🍪</p>
          <p>El menú está en preparación. Vuelve pronto.</p>
        </div>
      )}
    </div>
  );
}
