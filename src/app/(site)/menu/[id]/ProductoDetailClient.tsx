"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { useWishlistStore } from "@/lib/wishlistStore";
import ProductCard from "@/components/ProductCard";
import BLIcon from "@/components/BLIcon";
import OpinionForm from "@/components/OpinionForm";
import { storeConfig } from "@/config/store";
import type { Producto, Resena } from "@/types/database";

const ESTRELLAS_LABEL = ["", "★", "★★", "★★★", "★★★★", "★★★★★"];

export default function ProductoDetailClient({
  producto,
  similares,
  resenas,
}: {
  producto: Producto;
  similares: Producto[];
  resenas: Resena[];
}) {
  const addItem            = useCartStore((s) => s.addItem);
  const isAtCategoryLimit  = useCartStore((s) => s.isAtCategoryLimit);
  const cartQty            = useCartStore((s) => s.items.find(i => i.id === producto.id)?.quantity ?? 0);
  const toggleFav          = useWishlistStore((s) => s.toggle);
  const isFav              = useWishlistStore((s) => s.has(producto.id));

  const allImgs = [producto.imagen_url, ...(producto.imagenes ?? [])].filter(Boolean) as string[];

  const [imgIdx, setImgIdx] = useState(0);
  const [qty,    setQty]    = useState(1);
  const [added,  setAdded]  = useState(false);

  const agotado       = producto.disponible && producto.stock === 0;
  const stockRestante = Math.max(0, producto.stock - cartQty);
  const sinStock      = producto.stock > 0 && stockRestante === 0;
  const limiteAlcanzado = producto.categoria ? isAtCategoryLimit(producto.categoria) : false;
  const bloqueado     = limiteAlcanzado || sinStock;
  const sym = storeConfig.currencySymbol;

  // Autoplay del carrusel de imágenes
  useEffect(() => {
    if (allImgs.length <= 1) return;
    const t = setInterval(() => setImgIdx((i) => (i + 1) % allImgs.length), 4500);
    return () => clearInterval(t);
  }, [allImgs.length]);

  function handleAdd() {
    if (bloqueado) return;
    const toAdd = Math.min(qty, stockRestante);
    for (let i = 0; i < toAdd; i++) {
      addItem({ id: producto.id, name: producto.nombre, price: Number(producto.precio), emoji: producto.emoji ?? "🍪", categoria: producto.categoria });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <>
      {/* ── Breadcrumb ── */}
      <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)", paddingTop: "clamp(20px,3vw,36px)" }}>
        <nav className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-soft)" }}>
          <Link href="/menu" className="no-underline hover:underline" style={{ color: "var(--ink-soft)" }}>Menú</Link>
          <span>›</span>
          <span style={{ color: "var(--ink)" }}>{producto.nombre}</span>
        </nav>
      </div>

      {/* ── Main grid ── */}
      <div
        className="mx-auto px-[var(--gutter)] grid bl-grid-2col items-start"
        style={{ maxWidth: "var(--maxw)", gridTemplateColumns: "1fr 1fr", gap: "clamp(28px,5vw,64px)", paddingBlock: "clamp(28px,4vw,52px)" }}
      >
        {/* ── Gallery ── */}
        <div>
          {/* Main image */}
          <div
            className="relative overflow-hidden rounded-[24px] w-full"
            style={{ aspectRatio: "1/1", background: "var(--cream)", boxShadow: "var(--shadow-md)" }}
          >
            {allImgs.length > 0 ? (
              <Image
                key={imgIdx}
                src={allImgs[imgIdx]}
                alt={producto.nombre}
                fill
                className="object-cover bl-img-fade"
                sizes="(max-width: 920px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-[80px]">
                {producto.emoji ?? "🍪"}
              </div>
            )}

            {/* Wishlist */}
            <button
              onClick={() => toggleFav(producto.id)}
              aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
              className="absolute top-4 right-4 w-10 h-10 rounded-full grid place-items-center cursor-pointer border transition-colors"
              style={{
                background: "var(--paper-card)",
                borderColor: isFav ? "var(--berry)" : "var(--hairline)",
                color: isFav ? "var(--berry)" : "var(--ink-soft)",
              }}
            >
              <BLIcon name="heart" size={18} />
            </button>

            {/* Arrows */}
            {allImgs.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + allImgs.length) % allImgs.length)}
                  aria-label="Foto anterior"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full grid place-items-center cursor-pointer border transition-colors"
                  style={{ background: "var(--paper-card)", borderColor: "var(--hairline)", color: "var(--ink-soft)" }}
                >
                  <BLIcon name="arrow-right" size={18} className="rotate-180" />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % allImgs.length)}
                  aria-label="Foto siguiente"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full grid place-items-center cursor-pointer border transition-colors"
                  style={{ background: "var(--paper-card)", borderColor: "var(--hairline)", color: "var(--ink-soft)" }}
                >
                  <BLIcon name="arrow-right" size={18} />
                </button>
              </>
            )}

            {/* Agotado overlay */}
            {agotado && (
              <span
                className="absolute top-4 left-4 text-[13px] font-semibold px-3 py-1 rounded-full"
                style={{ background: "rgba(40,30,20,.82)", color: "#fff", backdropFilter: "blur(4px)" }}
              >
                Agotado hoy
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {allImgs.length > 1 && (
            <div className="flex gap-3 mt-3 flex-wrap">
              {allImgs.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  aria-label={`Foto ${i + 1}`}
                  className="overflow-hidden rounded-[12px] border-2 transition-colors flex-none"
                  style={{
                    width: 64, height: 64,
                    borderColor: i === imgIdx ? "var(--orange)" : "var(--hairline)",
                    background: "var(--cream)",
                    padding: 0,
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <Image src={src} alt={`${producto.nombre} ${i + 1}`} fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info panel ── */}
        <div className="flex flex-col gap-5">
          {/* Category chip */}
          {producto.categoria && (
            <Link
              href={`/menu`}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-[.12em] uppercase no-underline"
              style={{ color: "var(--orange)" }}
            >
              <BLIcon name="brownie" size={13} />
              {producto.categoria}
            </Link>
          )}

          {/* Name */}
          <h1
            className="font-extrabold leading-tight"
            style={{
              fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)",
              fontSize: "clamp(30px,4vw,46px)",
              color: "var(--ink)",
              margin: 0,
            }}
          >
            {producto.nombre}
          </h1>

          {/* Price */}
          <p
            className="font-extrabold"
            style={{
              fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)",
              fontSize: "clamp(28px,3.5vw,38px)",
              color: "var(--orange-ink)",
              margin: 0,
            }}
          >
            {sym}{Number(producto.precio).toFixed(2)}
            <span className="text-[14px] font-semibold ml-2" style={{ color: "var(--ink-soft)" }}>
              {storeConfig.currency}
            </span>
          </p>

          {/* Description */}
          {(producto.descripcion_larga || producto.descripcion) && (
            <p style={{ fontSize: 16, color: "var(--ink-soft)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>
              {producto.descripcion_larga || producto.descripcion}
            </p>
          )}

          {/* Prep time */}
          {producto.tiempo_preparacion && (
            <div className="flex items-center gap-2 text-[14px]" style={{ color: "var(--ink-soft)" }}>
              <BLIcon name="clock" size={15} />
              {producto.tiempo_preparacion}
            </div>
          )}

          {/* Tags */}
          {producto.etiquetas && producto.etiquetas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {producto.etiquetas.map((tag) => (
                <span key={tag} className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "var(--choco-900)", color: "var(--amber)", letterSpacing: ".04em" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Allergens */}
          {producto.alergenos && producto.alergenos.length > 0 && (
            <div>
              <p className="text-[11px] font-bold tracking-[.1em] uppercase mb-2" style={{ color: "var(--ink-soft)" }}>
                Contiene
              </p>
              <div className="flex flex-wrap gap-2">
                {producto.alergenos.map((a) => (
                  <span key={a} className="text-[12px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(158,59,70,.08)", color: "var(--berry)", border: "1px solid rgba(158,59,70,.15)" }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <hr style={{ border: 0, borderTop: "1px solid var(--hairline)", margin: "4px 0" }} />

          {/* Add to cart */}
          {agotado ? (
            <a
              href={`https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(`Hola! Me interesa *${producto.nombre}* pero está agotado. ¿Cuándo vuelve? 🍪`)}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 font-bold text-[15px] py-4 rounded-full no-underline transition-colors"
              style={{ background: "var(--cream)", color: "var(--orange-ink)", border: "1.5px solid var(--amber)" }}
            >
              <BLIcon name="whatsapp" size={18} />
              Avísame cuando vuelva
            </a>
          ) : producto.disponible ? (
            <div className="flex items-center gap-3">
              {/* Qty stepper */}
              <div className="inline-flex items-center overflow-hidden"
                style={{ border: "1.5px solid var(--hairline)", borderRadius: "var(--r-pill)" }}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-[42px] h-[42px] grid place-items-center border-0 cursor-pointer"
                  style={{ background: "transparent", color: "var(--ink)" }} aria-label="Menos">
                  <BLIcon name="minus" size={16} />
                </button>
                <span className="font-bold text-[16px] text-center" style={{ minWidth: 30, color: "var(--ink)" }}>
                  {qty}
                </span>
                <button onClick={() => setQty((q) => Math.min(q + 1, Math.max(1, stockRestante)))}
                  className="w-[42px] h-[42px] grid place-items-center border-0 cursor-pointer"
                  style={{ background: "transparent", color: "var(--ink)" }} aria-label="Más">
                  <BLIcon name="plus" size={16} />
                </button>
              </div>

              <button
                onClick={handleAdd}
                disabled={bloqueado}
                className="flex-1 inline-flex items-center justify-center gap-2 font-bold text-[16px] py-4 rounded-full border-0 text-white transition-all"
                style={{
                  background: bloqueado ? "var(--ink-soft, #aaa)" : added ? "var(--wa)" : "var(--orange)",
                  boxShadow: added || bloqueado ? "none" : "0 6px 18px rgba(217,113,30,.32)",
                  cursor: bloqueado ? "not-allowed" : "pointer",
                }}
              >
                <BLIcon name="cart" size={18} />
                {sinStock ? "Sin disponibilidad" : limiteAlcanzado ? "Límite del pedido" : added ? "✓ Agregado" : `Agregar${qty > 1 ? ` (${qty})` : ""}`}
              </button>
            </div>
          ) : (
            <button disabled className="w-full font-bold text-[15px] py-4 rounded-full border-0 cursor-not-allowed"
              style={{ background: "var(--cream-200)", color: "var(--ink-soft)" }}>
              <BLIcon name="clock" size={16} /> No disponible
            </button>
          )}

          <Link href="/menu" className="inline-flex items-center gap-1.5 text-[14px] font-semibold no-underline mt-1"
            style={{ color: "var(--ink-soft)" }}>
            <BLIcon name="arrow-right" size={14} className="rotate-180" />
            Volver al menú
          </Link>
        </div>
      </div>

      {/* ── Reseñas ── */}
      <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)", paddingBlock: "var(--sec-pad-sm)" }}>
        <h2
          className="mb-6"
          style={{ fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)", fontSize: "var(--h2-size-sm)", color: "var(--ink)" }}
        >
          Reseñas
        </h2>

        <div className="grid bl-grid-2col" style={{ gridTemplateColumns: "1fr 1fr", gap: "clamp(28px,5vw,64px)" }}>
          {/* Lista de reseñas aprobadas */}
          <div className="flex flex-col gap-4">
            {resenas.length === 0 ? (
              <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
                Aún no hay reseñas para este producto. ¡Sé el primero en compartir tu opinión!
              </p>
            ) : (
              resenas.map((r) => (
                <div key={r.id}
                  style={{ background: "var(--paper-card)", border: "1px solid var(--hairline)", borderRadius: "var(--r-md)", padding: "16px 18px" }}>
                  <div className="flex items-center justify-between gap-3">
                    <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{r.autor}</span>
                    <span style={{ color: "var(--amber)", letterSpacing: 1, fontSize: 13 }}>{ESTRELLAS_LABEL[r.estrellas]}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: "8px 0 0" }}>{r.texto}</p>
                </div>
              ))
            )}
          </div>

          {/* Formulario de envío */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>Déjanos tu opinión</h3>
            <OpinionForm productoId={producto.id} productoNombre={producto.nombre} />
          </div>
        </div>
      </div>

      {/* ── También te puede interesar ── */}
      {similares.length > 0 && (
        <section style={{ background: "var(--cream)", paddingBlock: "clamp(48px,6vw,80px)" }}>
          <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
            <h2
              className="mb-8"
              style={{
                fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)",
                fontSize: "clamp(24px,3vw,34px)",
                color: "var(--ink)",
              }}
            >
              También te puede interesar
            </h2>
            <div
              className="grid gap-6 bl-grid-3col"
              style={{ gridTemplateColumns: `repeat(${Math.min(similares.length, 3)}, 1fr)` }}
            >
              {similares.slice(0, 3).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <style>{`
        @media (max-width: 920px) {
          .bl-grid-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
