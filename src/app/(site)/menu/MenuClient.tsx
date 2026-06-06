"use client";

import { useState } from "react";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import BLIcon from "@/components/BLIcon";
import type { Producto, Categoria, Especial } from "@/types/database";
import type { BLIconName } from "@/components/BLIcon";

function catIcon(slug: string): BLIconName {
  if (slug.includes("galleta") || slug.includes("cookie")) return "mark";
  if (slug.includes("especial") || slug.includes("limited") || slug.includes("chef")) return "sparkle";
  return "brownie";
}

function getDiasRestantes(fechaInicio: string, duracionDias: number): number {
  const end = new Date(fechaInicio);
  end.setDate(end.getDate() + duracionDias);
  const now = new Date(); now.setHours(0,0,0,0); end.setHours(0,0,0,0);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
}

export default function MenuClient({
  productos,
  categorias,
  especiales = [],
  whatsapp = "",
}: {
  productos: Producto[];
  categorias: Categoria[];
  especiales?: Especial[];
  whatsapp?: string;
}) {
  const LABELS = Object.fromEntries(categorias.map((c) => [c.slug, c.nombre]));
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const allCats = [...new Set(productos.map((p) => p.categoria))];

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
    (acc[p.categoria] as Producto[]).push(p);
    return acc;
  }, {});

  const noResults = filtered.length === 0 && (search || activeCategory);

  return (
    <>
      {/* Page header */}
      <section
        className="text-center"
        style={{
          color: "var(--on-dark)",
          background:
            "radial-gradient(110% 120% at 85% -10%, rgba(232,162,58,.25), transparent 55%), linear-gradient(150deg, var(--choco-900) 0%, var(--choco-700) 100%)",
          paddingBlock: "clamp(48px, 7vw, 76px)",
        }}
      >
        <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
          <span
            className="inline-flex items-center gap-2 justify-center text-[12px] font-bold tracking-[0.22em] uppercase"
            style={{ color: "var(--amber)" }}
          >
            <BLIcon name="brownie" size={15} />
            Hecho a mano · con obsesión
          </span>
          <h1
            className="font-extrabold mt-4 mb-3"
            style={{ fontSize: "clamp(40px, 6vw, 68px)", color: "var(--on-dark)" }}
          >
            Nuestro Menú
          </h1>
          <p style={{ color: "var(--on-dark-soft)", fontSize: "clamp(16px, 1.4vw, 19px)", maxWidth: "44ch", marginInline: "auto" }}>
            Brownies y galletas horneados a mano. Pedidos con 24h de anticipación.
          </p>
        </div>
      </section>

      {/* Sticky toolbar */}
      <div
        className="sticky z-30"
        style={{
          top: 72,
          background: "rgba(251,246,236,.88)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div
          className="mx-auto px-[var(--gutter)] flex items-center gap-4 flex-wrap"
          style={{ maxWidth: "var(--maxw)", paddingBlock: 16 }}
        >
          {/* Search */}
          <label
            className="flex-1 flex items-center relative"
            style={{ minWidth: 220 }}
          >
            <BLIcon
              name="search"
              size={18}
              className="absolute left-4 pointer-events-none"
              style={{ color: "var(--ink-soft)" } as React.CSSProperties}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto…"
              aria-label="Buscar producto"
              className="w-full border focus:outline-none"
              style={{
                borderRadius: "var(--r-pill)",
                padding: "13px 18px 13px 46px",
                fontFamily: "inherit",
                fontSize: 15,
                color: "var(--ink)",
                background: "var(--paper-card)",
                borderColor: "var(--hairline)",
              }}
              onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--orange)")}
              onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--hairline)")}
            />
          </label>

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            <FilterBtn active={activeCategory === null} onClick={() => setActiveCategory(null)}>
              Todos
            </FilterBtn>
            {allCats.map((cat) => (
              <FilterBtn
                key={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              >
                {LABELS[cat] ?? cat}
              </FilterBtn>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main
        className="mx-auto px-[var(--gutter)]"
        style={{ maxWidth: "var(--maxw)", paddingBottom: "clamp(56px, 7vw, 96px)" }}
      >
        {/* ── Especiales activos ── */}
        {especiales.length > 0 && !activeCategory && !search && (
          <section style={{ paddingTop: "clamp(36px,4vw,52px)", paddingBottom: 0 }}>
            <div className="flex items-center gap-2.5 mb-5">
              <BLIcon name="sparkle" size={16} style={{ color: "var(--orange)" } as React.CSSProperties} />
              <span className="text-[12px] font-bold tracking-[.18em] uppercase" style={{ color: "var(--orange)" }}>
                Capricho del Chef
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {especiales.map(e => {
                const dias = getDiasRestantes(e.fecha_inicio, e.duracion_dias);
                const allImgs = [e.imagen_url, ...(Array.isArray(e.imagenes) ? e.imagenes : [])].filter(Boolean) as string[];
                return (
                  <div key={e.id}
                    className="flex items-center gap-5 rounded-[20px] overflow-hidden"
                    style={{ background: "var(--choco-900)", color: "var(--on-dark)", padding: "clamp(16px,2vw,24px)" }}
                  >
                    {/* Image or emoji */}
                    <div className="flex-none relative overflow-hidden rounded-[14px]"
                      style={{ width: 80, height: 80, background: "rgba(255,255,255,.06)", flexShrink: 0 }}>
                      {allImgs.length > 0 ? (
                        <Image src={allImgs[0]} alt={e.nombre} fill className="object-cover"
                          sizes="80px" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-4xl">{e.emoji}</div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-extrabold text-[18px]"
                          style={{ fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)", color: "var(--on-dark)" }}>
                          {e.nombre}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
                          style={{ background: dias <= 2 ? "rgba(217,113,30,.3)" : "rgba(255,255,255,.12)", color: dias <= 2 ? "var(--amber)" : "var(--on-dark-soft)" }}>
                          {dias === 1 ? "último día" : `${dias} días`}
                        </span>
                      </div>
                      <p className="text-[14px] line-clamp-2" style={{ color: "var(--on-dark-soft)" }}>{e.descripcion}</p>
                    </div>
                    {/* CTA */}
                    {whatsapp && (
                      <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola! Me interesa el ${e.nombre} del Capricho del Chef 🍪`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-none inline-flex items-center gap-2 font-bold text-[14px] px-4 py-2.5 rounded-full text-white no-underline"
                        style={{ background: "var(--orange)", boxShadow: "0 4px 14px rgba(217,113,30,.4)", whiteSpace: "nowrap" }}>
                        <BLIcon name="whatsapp" size={16} />
                        Pedir
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {noResults ? (
          <div
            className="text-center py-16 flex flex-col items-center gap-3"
            style={{ color: "var(--ink-soft)" }}
          >
            <BLIcon name="search" size={40} style={{ color: "var(--hairline)" } as React.CSSProperties} />
            <h3
              className="font-bold text-[18px]"
              style={{ fontFamily: "inherit", color: "var(--ink)" }}
            >
              Sin resultados
            </h3>
            <p>No encontramos nada con esa búsqueda. Prueba otra palabra.</p>
            <button
              onClick={() => { setSearch(""); setActiveCategory(null); }}
              className="text-sm font-semibold cursor-pointer border-0 bg-transparent underline"
              style={{ color: "var(--orange-ink)" }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <section
              key={category}
              data-cat={category}
              style={{ paddingTop: "clamp(48px, 6vw, 72px)" }}
            >
              {/* Category header */}
              <div className="flex items-center gap-4 mb-7">
                <span
                  className="w-[46px] h-[46px] rounded-[12px] grid place-items-center flex-none"
                  style={{ background: "var(--cream)", color: "var(--orange-ink)" }}
                >
                  <BLIcon name={catIcon(category)} size={24} />
                </span>
                <h2
                  className="font-bold"
                  style={{ fontSize: "clamp(26px, 3.4vw, 38px)", color: "var(--ink)" }}
                >
                  {LABELS[category] ?? category}
                </h2>
                <span
                  className="text-[13px] font-bold px-3 py-1 rounded-full"
                  style={{ background: "var(--cream-200)", color: "var(--ink-soft)" }}
                >
                  {items.length}
                </span>
                <span className="flex-1 h-px" style={{ background: "var(--hairline)" }} />
              </div>

              <div
                className="grid gap-6 bl-grid-3col"
                style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
              >
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ))
        )}

        {productos.length === 0 && !search && (
          <div className="text-center py-20" style={{ color: "var(--ink-soft)" }}>
            <BLIcon name="brownie" size={48} className="mx-auto mb-4" />
            <p>El menú está en preparación. Vuelve pronto.</p>
          </div>
        )}
      </main>
    </>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="text-[14px] font-bold px-5 py-[11px] rounded-full cursor-pointer border transition-colors"
      style={{
        background: active ? "var(--choco-900)" : "var(--paper-card)",
        color: active ? "var(--on-dark)" : "var(--ink-soft)",
        borderColor: active ? "var(--choco-900)" : "var(--hairline)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

