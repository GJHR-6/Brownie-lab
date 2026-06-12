import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import AnimateIn from "@/components/AnimateIn";
import ClubSection from "@/components/ClubSection";
import CaprichoCarousel from "@/components/CaprichoCarousel";
import BLIcon from "@/components/BLIcon";
import GiftIntro from "@/components/GiftIntro";
import { storeConfig } from "@/config/store";
import Image from "next/image";
import { getProductosPublicos, getEspecialesActivos, getConfiguracion, getProductosDestacados, getTestimoniosAprobados } from "@/lib/data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: {
    absolute: "Brownie Lab — Brownies y galletas artesanales en Honduras",
  },
  description:
    "Brownies y galletas hechos a mano con ingredientes reales. Pedidos con 24 h de anticipación. Pickup o entrega a domicilio en Honduras.",
  openGraph: {
    title: "Brownie Lab — Brownies y galletas artesanales",
    description:
      "Brownies y galletas hechos a mano con ingredientes reales. Pedidos con 24 h de anticipación.",
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Brownie Lab" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brownie Lab — Brownies y galletas artesanales",
    description: "Brownies y galletas hechos a mano con ingredientes reales.",
    images: ["/opengraph-image"],
  },
};

function getDaysLeft(fechaInicio: string, duracionDias: number): number {
  const end = new Date(fechaInicio);
  end.setDate(end.getDate() + duracionDias);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

const SEC: React.CSSProperties = { paddingBlock: "clamp(64px, 9vw, 120px)" };

export default async function Home() {
  const [productos, especiales, config, capricho, testimonios] = await Promise.all([
    getProductosPublicos(),
    getEspecialesActivos(),
    getConfiguracion(),
    getProductosDestacados(),
    getTestimoniosAprobados(),
  ]);
  const whatsapp = config?.whatsapp || storeConfig.whatsapp;
  const featured = productos.slice(0, 3);
  const activeSpecials = especiales.filter(
    (e) => getDaysLeft(e.fecha_inicio, e.duracion_dias) > 0
  );

  return (
    <div>
      <GiftIntro />
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          color: "var(--on-dark)",
          background:
            "radial-gradient(120% 90% at 80% 10%, rgba(232,162,58,.30), transparent 55%), linear-gradient(160deg, var(--choco-900) 0%, var(--choco-700) 42%, var(--orange-ink) 100%)",
        }}
      >
        <div
          className="mx-auto px-[var(--gutter)] grid items-center gap-[clamp(32px,5vw,72px)] bl-grid-hero"
          style={{
            maxWidth: "var(--maxw)",
            gridTemplateColumns: "1.05fr .95fr",
            paddingBlock: "clamp(56px, 8vw, 104px)",
          }}
        >
          {/* Copy */}
          <div>
            <span
              className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.22em] uppercase"
              style={{ color: "var(--amber)" }}
            >
              <BLIcon name="sparkle" size={15} style={{ color: "var(--amber)" } as React.CSSProperties} />
              Hecho a mano · con obsesión
            </span>
            <h1
              className="font-extrabold mt-4 mb-5"
              style={{ fontSize: "clamp(40px, 5.6vw, 72px)", color: "var(--on-dark)" }}
            >
              El brownie<br />perfecto existe.
            </h1>
            <p style={{ fontSize: "clamp(17px, 1.5vw, 20px)", color: "var(--on-dark-soft)", maxWidth: "50ch" }}>
              Empezamos con una obsesión: encontrar la receta ideal. En el camino nacieron
              galletas que también te van a enamorar.{" "}
              <span style={{ color: "var(--amber)", fontWeight: 600 }}>
                Spoiler: son adictivas.
              </span>
            </p>
            <div className="flex flex-wrap gap-3.5 mt-8">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-full text-white no-underline transition-colors"
                style={{ background: "var(--orange)", boxShadow: "0 6px 18px rgba(217,113,30,.32)" }}
              >
                Ver el menú
                <BLIcon name="arrow-right" size={16} />
              </Link>
              <Link
                href="/personaliza"
                className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-full no-underline transition-colors border"
                style={{
                  color: "var(--on-dark)",
                  borderColor: "rgba(246,234,212,.4)",
                  background: "transparent",
                }}
              >
                Arma tu postre
                <BLIcon name="sparkle" size={16} />
              </Link>
            </div>
          </div>

          {/* Media */}
          <div className="relative">
            {config?.hero_imagen_url ? (
              <div className="relative w-full overflow-hidden rounded-[24px]" style={{ aspectRatio: "1/1", boxShadow: "var(--shadow-lg)" }}>
                <Image src={config.hero_imagen_url} alt="Brownie Lab" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
              </div>
            ) : (
              <div
                className="w-full rounded-[24px]"
                style={{
                  aspectRatio: "1/1",
                  background:
                    "repeating-linear-gradient(135deg, rgba(246,234,212,.06) 0 10px, rgba(246,234,212,0) 10px 20px), var(--choco-800)",
                  boxShadow: "var(--shadow-lg)",
                }}
              />
            )}
            {/* Floating chip 1 — hidden on small screens to avoid overflow */}
            <div
              className="hidden sm:flex absolute top-4 -left-3 items-center gap-2 bg-white rounded-full px-4 py-2.5 text-[13px] font-bold"
              style={{ color: "var(--ink)", boxShadow: "var(--shadow-md)" }}
            >
              <BLIcon name="leaf" size={16} style={{ color: "var(--orange)" } as React.CSSProperties} />
              Ingredientes reales
            </div>
            {/* Floating chip 2 — hidden on small screens to avoid overflow */}
            <div
              className="hidden sm:flex absolute bottom-6 -right-2 items-center gap-2 bg-white rounded-full px-4 py-2.5 text-[13px] font-bold"
              style={{ color: "var(--ink)", boxShadow: "var(--shadow-md)" }}
            >
              <BLIcon name="heart" size={16} style={{ color: "var(--berry)" } as React.CSSProperties} />
              +500 pedidos felices
            </div>
          </div>
        </div>
      </section>

      {/* ── Capricho del Chef (especiales + productos destacados) ─────── */}
      {(activeSpecials.length > 0 || capricho.length > 0) && (
        <AnimateIn>
          <section style={{ background: "var(--choco-900)", color: "var(--on-dark)", paddingBlock: "clamp(64px, 9vw, 120px)" }}>
            {/* Header de la sección */}
            <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
              <div className="flex items-center gap-3 mb-2">
                <BLIcon name="sparkle" size={18} style={{ color: "var(--amber)" } as React.CSSProperties} />
                <span className="text-[12px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--amber)" }}>
                  Capricho del Chef
                </span>
              </div>
              <h2 className="mb-2" style={{ fontSize: "clamp(28px, 3.6vw, 40px)", color: "var(--on-dark)" }}>
                Selección especial
              </h2>
              <p style={{ color: "var(--on-dark-soft)", fontSize: 16, maxWidth: "48ch", marginBottom: "clamp(32px, 5vw, 56px)" }}>
                Creaciones que el chef destaca esta temporada.
              </p>
            </div>

            {/* Carrusel de especiales activos */}
            {activeSpecials.length > 0 && (
              <CaprichoCarousel especiales={activeSpecials} whatsapp={whatsapp} />
            )}

            {/* Productos destacados por el chef — misma sección */}
            {capricho.length > 0 && (
              <div
                className="mx-auto px-[var(--gutter)]"
                style={{ maxWidth: "var(--maxw)", marginTop: activeSpecials.length > 0 ? "clamp(48px, 7vw, 88px)" : 0 }}
              >
                {activeSpecials.length > 0 && (
                  <p className="text-[12px] font-bold tracking-[0.22em] uppercase mb-6" style={{ color: "var(--amber)" }}>
                    También destacados
                  </p>
                )}
                <div
                  className="grid gap-6 bl-grid-3col"
                  style={{ gridTemplateColumns: `repeat(${Math.min(capricho.length, 3)}, 1fr)` }}
                >
                  {capricho.map((p) => (
                    <AnimateIn key={p.id}>
                      <ProductCard product={p} />
                    </AnimateIn>
                  ))}
                </div>
              </div>
            )}
          </section>
        </AnimateIn>
      )}

      {/* ── Favoritos del momento ─────────────────────────────────────── */}
      {featured.length > 0 && (
        <AnimateIn delay={100}>
          <section style={{ ...SEC }}>
            <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
              <div className="text-center" style={{ marginBottom: "clamp(40px, 5vw, 60px)", maxWidth: "60ch", marginInline: "auto" }}>
                <span
                  className="text-[12px] font-bold tracking-[0.22em] uppercase"
                  style={{ color: "var(--orange)" }}
                >
                  Los más pedidos
                </span>
                <h2 className="mt-3" style={{ fontSize: "clamp(32px, 4.6vw, 52px)" }}>
                  Favoritos del momento
                </h2>
                <p className="mt-3" style={{ color: "var(--ink-soft)", fontSize: 17 }}>
                  Todo hecho a mano. Pedidos con 24h de anticipación.
                </p>
              </div>

              <div
                className="grid gap-6 bl-grid-3col"
                style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
              >
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-full no-underline transition-colors"
                  style={{
                    background: "var(--paper-card)",
                    color: "var(--ink)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  Ver todo el menú
                  <BLIcon name="arrow-right" size={16} />
                </Link>
              </div>
            </div>
          </section>
        </AnimateIn>
      )}

      {/* ── Arma tu postre ────────────────────────────────────────────── */}
      <section style={{ background: "var(--cream)", ...SEC }}>
        <div
          className="mx-auto px-[var(--gutter)] grid items-center gap-[clamp(32px,5vw,72px)] bl-grid-2col"
          style={{ maxWidth: "var(--maxw)", gridTemplateColumns: "1fr 1fr" }}
        >
          <div>
            <span
              className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-[0.22em] uppercase"
              style={{ color: "var(--orange)" }}
            >
              <BLIcon name="sparkle" size={14} />
              Nuevo
            </span>
            <h2 className="mt-3 mb-4" style={{ fontSize: "clamp(32px, 4.4vw, 50px)" }}>
              Arma tu postre ideal
            </h2>
            <p className="mb-7" style={{ color: "var(--ink-soft)", fontSize: 17, maxWidth: "42ch" }}>
              Elige la base y agrégale los toppings que quieras. Míralo antes de pedirlo.
            </p>
            <div className="flex flex-wrap gap-2.5 mb-8">
              {["Pecanas", "Chispas de chocolate", "Arándanos", "Caramelo", "Coco rallado", "Sal de mar", "Almendras", "Frambuesas"].map(
                (t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 text-[14px] font-semibold px-4 py-2 rounded-full border"
                    style={{
                      background: "var(--paper-card)",
                      borderColor: "var(--hairline)",
                      color: "var(--ink)",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: "var(--orange)" }}
                    />
                    {t}
                  </span>
                )
              )}
            </div>
            <Link
              href="/personaliza"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-full text-white no-underline transition-colors"
              style={{ background: "var(--orange)", boxShadow: "0 6px 18px rgba(217,113,30,.32)" }}
            >
              Personalizar ahora
              <BLIcon name="arrow-right" size={16} />
            </Link>
          </div>
          {/* Media — imagen del personalizador */}
          {config?.personalizador_imagen_url ? (
            <div className="relative w-full overflow-hidden rounded-[24px]" style={{ aspectRatio: "1/1", boxShadow: "var(--shadow-md)" }}>
              <Image src={config.personalizador_imagen_url} alt="Arma tu postre" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
          ) : (
          <div
            className="rounded-[24px]"
            style={{
              aspectRatio: "1/1",
              background:
                "repeating-linear-gradient(135deg, rgba(116,58,20,.07) 0 10px, rgba(116,58,20,0) 10px 20px), var(--cream-200)",
              boxShadow: "var(--shadow-md)",
            }}
          />
          )}
        </div>
      </section>

      {/* ── Testimonios ──────────────────────────────────────────────── */}
      {testimonios.length > 0 && (
        <section style={{ ...SEC }}>
          <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
            <AnimateIn className="text-center mb-10">
              <span className="text-[12px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--orange)" }}>
                Lo que dicen nuestros clientes
              </span>
              <h2 className="mt-3" style={{ fontSize: "clamp(28px, 3.6vw, 40px)", color: "var(--ink)" }}>
                Opiniones reales
              </h2>
            </AnimateIn>
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {testimonios.map((t) => (
                <AnimateIn key={t.id}>
                  <div
                    className="flex flex-col gap-3 rounded-[20px] p-6"
                    style={{ background: "var(--paper-card)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-sm)" }}
                  >
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{ color: i < t.estrellas ? "var(--amber)" : "var(--hairline)", fontSize: 16 }}>★</span>
                      ))}
                    </div>
                    <p className="text-[15px] leading-relaxed flex-1" style={{ color: "var(--ink)" }}>
                      &ldquo;{t.texto}&rdquo;
                    </p>
                    <p className="text-[13px] font-semibold" style={{ color: "var(--ink-soft)" }}>
                      — {t.autor}
                    </p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Club Brownie Lab ──────────────────────────────────────────── */}
      <ClubSection />

      {/* ── Contacto ──────────────────────────────────────────────────── */}
      <section className="text-center" style={{ ...SEC }}>
        <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
          <span
            className="text-[12px] font-bold tracking-[0.22em] uppercase"
            style={{ color: "var(--orange)" }}
          >
            Estamos para ayudarte
          </span>
          <h2 className="mt-3 mb-3" style={{ fontSize: "clamp(30px, 4vw, 44px)" }}>
            ¿Tienes alguna pregunta?
          </h2>
          <p className="mb-7" style={{ color: "var(--ink-soft)", fontSize: 17 }}>
            Escríbenos por WhatsApp, con gusto te atendemos.
          </p>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-full text-white no-underline transition-colors"
              style={{ background: "var(--choco-900)" }}
            >
              <BLIcon name="whatsapp" size={20} style={{ color: "#58d684" } as React.CSSProperties} />
              Escribir por WhatsApp
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

