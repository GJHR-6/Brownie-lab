import type { Metadata } from "next";
import { storeConfig } from "@/config/store";
import { getConfiguracion } from "@/lib/data";
import BLIcon from "@/components/BLIcon";

export const metadata: Metadata = { title: "Nosotros" };

const VALORES = [
  {
    titulo: "Calidad",
    desc: "Usamos solo los mejores ingredientes. Cada brownie y cada galleta pasa por nuestro estándar antes de llegar a ti.",
    icon: "star" as const,
  },
  {
    titulo: "Artesanal",
    desc: "Todo se hace a mano, en pequeños lotes. Sin atajos, sin líneas de producción. Solo recetas y dedicación.",
    icon: "brownie" as const,
  },
  {
    titulo: "Pasión",
    desc: "Brownie Lab nació de una obsesión. Esa misma energía va en cada hornada, en cada detalle del producto.",
    icon: "sparkle" as const,
  },
  {
    titulo: "Honestidad",
    desc: "Lo que ves es lo que recibes. Ingredientes reales, precios justos y trato directo con quien hace tus postres.",
    icon: "heart" as const,
  },
];

export default async function NosotrosPage() {
  const config = await getConfiguracion();
  const whatsapp = config?.whatsapp || storeConfig.whatsapp;
  const instagram = config?.instagram || storeConfig.social.instagram;
  const facebook = config?.facebook || storeConfig.social.facebook;

  return (
    <div>
      {/* Hero */}
      <section
        className="text-center"
        style={{
          color: "var(--on-dark)",
          background:
            "radial-gradient(120% 90% at 80% 10%, rgba(232,162,58,.30), transparent 55%), linear-gradient(160deg, var(--choco-900) 0%, var(--choco-700) 42%, var(--orange-ink) 100%)",
          paddingBlock: "clamp(56px, 8vw, 96px)",
        }}
      >
        <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
          <span
            className="inline-flex items-center gap-2 justify-center text-[12px] font-bold tracking-[0.22em] uppercase"
            style={{ color: "var(--amber)" }}
          >
            <BLIcon name="brownie" size={15} />
            Quiénes somos
          </span>
          <h1
            className="font-extrabold mt-4 mb-4"
            style={{ fontSize: "clamp(40px, 5.6vw, 72px)", color: "var(--on-dark)" }}
          >
            Nosotros
          </h1>
          <p style={{ color: "var(--on-dark-soft)", fontSize: "clamp(17px, 1.5vw, 20px)", marginInline: "auto" }}>
            Una operación pequeña con una obsesión enorme: hornear el mejor brownie que hayas probado.
          </p>
        </div>
      </section>

      {/* Historia */}
      <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
        <div
          className="mx-auto px-[var(--gutter)] grid items-center gap-[clamp(32px,5vw,72px)] bl-grid-2col"
          style={{ maxWidth: "var(--maxw)", gridTemplateColumns: ".92fr 1.08fr" }}
        >
          {/* Media — imagen desde admin o placeholder */}
          {config?.nosotros_imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.nosotros_imagen_url}
              alt="Nuestra historia"
              className="rounded-[24px] w-full object-cover"
              style={{ aspectRatio: '4/5', boxShadow: 'var(--shadow-md)' }}
            />
          ) : (
            <div
              className="rounded-[24px]"
              style={{
                aspectRatio: '4/5',
                background:
                  'repeating-linear-gradient(135deg, rgba(116,58,20,.07) 0 10px, rgba(116,58,20,0) 10px 20px), var(--cream)',
                boxShadow: 'var(--shadow-md)',
              }}
            />
          )}
          <div>
            <span
              className="text-[12px] font-bold tracking-[0.22em] uppercase"
              style={{ color: "var(--orange)" }}
            >
              Nuestra historia
            </span>
            <h2 className="mt-3 mb-5" style={{ fontSize: "clamp(30px, 4vw, 46px)" }}>
              Empezó con una obsesión
            </h2>
            <p className="mb-4" style={{ color: "var(--ink-soft)", fontSize: 17, maxWidth: "50ch" }}>
              En Brownie Lab todo nació de una sola idea fija: encontrar la receta del brownie
              perfecto. Mientras la perfeccionábamos, fueron apareciendo galletas que también
              valía la pena compartir.
            </p>
            <p className="mb-4" style={{ color: "var(--orange-ink)", fontWeight: 600, fontSize: 17 }}>
              Spoiler: también son adictivas.
            </p>
            <p style={{ color: "var(--ink-soft)", fontSize: 17, maxWidth: "50ch" }}>
              Somos una operación pequeña y honesta. Cada pieza sale de nuestra cocina lista para
              sorprenderte — hecha con ingredientes reales, recetas propias y sin apuros. La
              calidad manda.
            </p>
          </div>
        </div>
      </section>

      {/* Misión y visión */}
      <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
        <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
          <div
            className="text-center"
            style={{ marginBottom: "clamp(40px, 5vw, 60px)" }}
          >
            <span
              className="text-[12px] font-bold tracking-[0.22em] uppercase"
              style={{ color: "var(--orange)" }}
            >
              Hacia dónde vamos
            </span>
            <h2 className="mt-3" style={{ fontSize: "clamp(32px, 4.6vw, 52px)" }}>
              Misión y visión
            </h2>
          </div>
          <div className="grid gap-6 bl-grid-2col" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div
              className="rounded-[24px] p-[clamp(28px,3.4vw,40px)]"
              style={{ background: "var(--cream)" }}
            >
              <span
                className="w-[54px] h-[54px] rounded-[14px] grid place-items-center mb-5"
                style={{ background: "rgba(217,113,30,.14)", color: "var(--orange-ink)" }}
              >
                <BLIcon name="pin" size={28} />
              </span>
              <h3
                className="mb-3"
                style={{ fontSize: 26, color: "var(--orange-ink)" }}
              >
                Misión
              </h3>
              <p style={{ color: "var(--ink-soft)", fontSize: 16, lineHeight: 1.7 }}>
                Ofrecer postres artesanales hechos con ingredientes de calidad y mucho cuidado,
                para quienes buscan algo distinto — honesto, hecho a mano y con un sabor que se
                recuerda.
              </p>
            </div>
            <div
              className="rounded-[24px] p-[clamp(28px,3.4vw,40px)]"
              style={{ background: "var(--choco-900)" }}
            >
              <span
                className="w-[54px] h-[54px] rounded-[14px] grid place-items-center mb-5"
                style={{ background: "rgba(232,162,58,.18)", color: "var(--amber)" }}
              >
                <BLIcon name="sparkle" size={28} />
              </span>
              <h3
                className="mb-3"
                style={{ fontSize: 26, color: "var(--amber)" }}
              >
                Visión
              </h3>
              <p style={{ color: "var(--on-dark-soft)", fontSize: 16, lineHeight: 1.7 }}>
                Ser la referencia en brownies y galletas artesanales, reconocidos por una receta
                que no se consigue en otro lado — y por una experiencia que vale la pena repetir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section style={{ background: "var(--cream)", paddingBlock: "clamp(64px, 9vw, 120px)" }}>
        <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
          <div
            className="text-center"
            style={{ marginBottom: "clamp(40px, 5vw, 60px)" }}
          >
            <span
              className="text-[12px] font-bold tracking-[0.22em] uppercase"
              style={{ color: "var(--orange)" }}
            >
              Lo que nos mueve
            </span>
            <h2 className="mt-3" style={{ fontSize: "clamp(32px, 4.6vw, 52px)" }}>
              Los valores detrás de cada hornada
            </h2>
          </div>
          <div className="grid gap-5 bl-grid-2col" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {VALORES.map((v) => (
              <div
                key={v.titulo}
                className="flex gap-4 rounded-[16px] p-[26px_28px]"
                style={{
                  background: "var(--paper-card)",
                  border: "1px solid var(--hairline)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <span
                  className="w-[46px] h-[46px] rounded-[12px] grid place-items-center flex-none"
                  style={{ background: "var(--cream)", color: "var(--orange-ink)" }}
                >
                  <BLIcon name={v.icon} size={24} />
                </span>
                <div>
                  <h3 className="mb-1.5" style={{ fontSize: 22 }}>{v.titulo}</h3>
                  <p style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.6 }}>
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Encuéntranos */}
      <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
        <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
          <div
            className="text-center"
            style={{ marginBottom: "clamp(40px, 5vw, 60px)" }}
          >
            <span
              className="text-[12px] font-bold tracking-[0.22em] uppercase"
              style={{ color: "var(--orange)" }}
            >
              Estamos cerca
            </span>
            <h2 className="mt-3 mb-3" style={{ fontSize: "clamp(32px, 4.6vw, 52px)" }}>
              Encuéntranos
            </h2>
            <p style={{ color: "var(--ink-soft)", fontSize: 17 }}>
              Para pedidos, preguntas o solo saludarnos.
            </p>
          </div>

          <div
            className="flex flex-col gap-3.5 mx-auto"
            style={{ maxWidth: 620 }}
          >
            {whatsapp && (
              <ChannelLink
                href={`https://wa.me/${whatsapp}`}
                iconBg="#1faa55"
                icon="whatsapp"
                title="WhatsApp"
                desc="Escríbenos para hacer pedidos o preguntas"
              />
            )}
            {instagram && (
              <ChannelLink
                href={instagram}
                iconBg="linear-gradient(135deg, #b8336a, #e08a3c)"
                icon="instagram"
                title="Instagram"
                desc="Síguenos para ver nuestras creaciones del día"
              />
            )}
            {facebook && (
              <ChannelLink
                href={facebook}
                iconBg="#2566c4"
                icon="facebook"
                title="Facebook"
                desc="Únete a nuestra comunidad"
              />
            )}
          </div>

          <div
            className="text-center mt-9 mx-auto rounded-[16px] px-7 py-5"
            style={{ maxWidth: 620, background: "var(--cream)", fontSize: 15, color: "var(--ink-soft)" }}
          >
            <strong style={{ color: "var(--orange-ink)" }}>Brownie Lab</strong> es una tienda
            artesanal. Los pedidos se confirman por WhatsApp y requieren anticipación de 24 horas.
          </div>
        </div>
      </section>
    </div>
  );
}

function ChannelLink({
  href,
  iconBg,
  icon,
  title,
  desc,
}: {
  href: string;
  iconBg: string;
  icon: "whatsapp" | "instagram" | "facebook";
  title: string;
  desc: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 rounded-[16px] p-5 no-underline transition-all"
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--hairline)",
        boxShadow: "var(--shadow-sm)",
        color: "var(--ink)",
      }}
    >
      <span
        className="w-12 h-12 rounded-[12px] grid place-items-center flex-none text-white"
        style={{ background: iconBg }}
      >
        <BLIcon name={icon} size={24} />
      </span>
      <span className="flex-1">
        <strong
          className="block text-[19px]"
          style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif" }}
        >
          {title}
        </strong>
        <span className="text-[14px]" style={{ color: "var(--ink-soft)" }}>{desc}</span>
      </span>
      <BLIcon name="arrow-right" size={20} style={{ color: "var(--ink-soft)" } as React.CSSProperties} />
    </a>
  );
}
