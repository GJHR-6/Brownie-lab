"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import products from "@/data/products.json";

const categories: Record<string, string> = {
  clasicas: "Clásicas",
  brownies: "Brownies",
  especiales: "Especiales",
};

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const availableCategories = [...new Set(products.map((p) => p.category))];

  const filtered = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products;

  const grouped = filtered.reduce<Record<string, typeof products>>(
    (acc, product) => {
      if (!acc[product.category]) acc[product.category] = [];
      acc[product.category].push(product);
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Header */}
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

      {/* Filter tabs */}
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
        {availableCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeCategory === cat
                ? "bg-amber-800 text-white"
                : "bg-amber-100 text-amber-800 hover:bg-amber-200"
            }`}
          >
            {categories[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Categories */}
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2
              className="text-2xl font-bold text-amber-800"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {categories[category] ?? category}
            </h2>
            <div className="flex-1 h-px bg-amber-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
