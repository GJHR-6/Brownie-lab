import type { Metadata } from "next";
import { storeConfig } from "@/config/store";
import BLIcon from "@/components/BLIcon";
import LegalIndex from "@/components/LegalIndex";

export const metadata: Metadata = { title: "Política de Privacidad" };

const SECTIONS = [
  { id: "p1", label: "Información que recopilamos" },
  { id: "p2", label: "Cómo usamos tu información" },
  { id: "p3", label: "Almacenamiento local" },
  { id: "p4", label: "Cookies y servicios externos" },
  { id: "p5", label: "Eliminación de datos" },
  { id: "p6", label: "Contacto" },
];

export default function PrivacidadPage() {
  const whatsapp = storeConfig.whatsapp;

  return (
    <>
      {/* Hero */}
      <section
        className="text-center"
        style={{
          color: "var(--on-dark)",
          background:
            "radial-gradient(120% 90% at 80% 10%, rgba(232,162,58,.30), transparent 55%), linear-gradient(160deg, var(--choco-900) 0%, var(--choco-700) 42%, var(--orange-ink) 100%)",
          paddingBlock: "clamp(52px, 7vw, 84px)",
        }}
      >
        <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)" }}>
          <span
            className="inline-flex items-center gap-2 justify-center text-[12px] font-bold tracking-[0.22em] uppercase"
            style={{ color: "var(--amber)" }}
          >
            <BLIcon name="leaf" size={15} />
            Tu información, protegida
          </span>
          <h1
            className="font-extrabold mt-4 mb-4"
            style={{ fontSize: "clamp(34px, 5vw, 60px)", color: "var(--on-dark)" }}
          >
            Política de Privacidad
          </h1>
          <p style={{ color: "var(--on-dark-soft)", fontSize: "clamp(16px, 1.4vw, 19px)", marginInline: "auto" }}>
            Recopilamos solo lo necesario para procesar tu pedido — nada más. Así cuidamos tus datos.
          </p>
        </div>
      </section>

      {/* Legal body */}
      <section style={{ paddingBlock: "clamp(48px, 6vw, 80px) clamp(64px, 9vw, 120px)" }}>
        <div
          className="mx-auto px-[var(--gutter)] grid gap-[clamp(40px,6vw,88px)] items-start"
          style={{ maxWidth: "var(--maxw)", gridTemplateColumns: "248px 1fr" }}
        >
          {/* Sticky TOC — hidden on mobile via CSS */}
          <div className="hidden lg:block">
            <LegalIndex sections={SECTIONS} />
          </div>

          {/* Content */}
          <div style={{ maxWidth: "72ch" }}>
            {/* Meta */}
            <div
              className="flex flex-wrap items-center gap-3 text-[14px] pb-[clamp(28px,3vw,36px)] mb-2"
              style={{ borderBottom: "1px solid var(--hairline)", color: "var(--ink-soft)" }}
            >
              <span
                className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full"
                style={{ background: "var(--cream-200)", color: "var(--orange-ink)" }}
              >
                <BLIcon name="clock" size={14} />
                Actualizado: mayo 2026
              </span>
              <span>No vendemos ni compartimos tu información personal.</span>
            </div>

            {/* Section 1 */}
            <LegalSection id="p1" num="1" title="Información que recopilamos">
              <LegalP>
                Al realizar un pedido o contactarnos a través de WhatsApp, recopilamos únicamente la
                información necesaria para procesar tu pedido:{" "}
                <strong>nombre, número de teléfono</strong> y las notas relacionadas con tu pedido.
              </LegalP>
              <LegalP>
                Si utilizas la función de seguimiento de pedido, el número de teléfono que ingresas
                se usa exclusivamente para consultar el estado de tus pedidos y no se almacena en
                sesión ni se comparte con terceros.
              </LegalP>
            </LegalSection>

            {/* Section 2 */}
            <LegalSection id="p2" num="2" title="Cómo usamos tu información">
              <ul className="legal-list">
                <li>Procesar y entregar tu pedido.</li>
                <li>Comunicarnos contigo sobre el estado de tu pedido por WhatsApp.</li>
                <li>Mostrar el estado de tu pedido cuando lo consultas en nuestro sitio.</li>
              </ul>
              <Callout>
                <strong>No</strong> vendemos, alquilamos ni compartimos tu información personal
                con ningún tercero para fines comerciales.
              </Callout>
            </LegalSection>

            {/* Section 3 */}
            <LegalSection id="p3" num="3" title="Almacenamiento local">
              <LegalP>
                Nuestro sitio utiliza el almacenamiento local de tu navegador (
                <em style={{ color: "var(--orange-ink)", fontStyle: "normal", fontFamily: "ui-monospace, monospace", fontSize: "0.92em" }}>localStorage</em>
                ) para guardar:
              </LegalP>
              <ul className="legal-list">
                <li>Los productos en tu carrito de compras.</li>
                <li>Tus productos favoritos.</li>
                <li>Productos vistos recientemente.</li>
              </ul>
              <LegalP>
                Esta información permanece únicamente en tu dispositivo y se elimina cuando
                limpias el almacenamiento del navegador.
              </LegalP>
            </LegalSection>

            {/* Section 4 */}
            <LegalSection id="p4" num="4" title="Cookies y servicios externos">
              <LegalP>
                Utilizamos Supabase como base de datos (alojada en servidores de AWS en us-east-1)
                y Vercel para el alojamiento del sitio. Ambos servicios tienen sus propias políticas
                de privacidad. No utilizamos cookies de rastreo ni publicidad de terceros.
              </LegalP>
            </LegalSection>

            {/* Section 5 */}
            <LegalSection id="p5" num="5" title="Eliminación de datos">
              <LegalP>
                Tienes derecho a solicitar la eliminación de cualquier dato personal que hayamos
                recopilado (nombre, teléfono, historial de pedidos).
              </LegalP>
              <LegalP>
                Para solicitar la eliminación de tus datos, envíanos un mensaje por WhatsApp
                indicando: <strong>&ldquo;Solicito eliminar mis datos personales&rdquo;</strong>{" "}
                junto con el número de teléfono asociado a tus pedidos. Procesamos la solicitud en
                un plazo máximo de <strong>72 horas</strong>.
              </LegalP>
              <WAButton
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Solicito eliminar mis datos personales")}`}
              >
                Solicitar eliminación por WhatsApp
              </WAButton>
            </LegalSection>

            {/* Section 6 */}
            <LegalSection id="p6" num="6" title="Contacto">
              <LegalP>
                Si tienes preguntas sobre esta política, escríbenos a través de WhatsApp.
              </LegalP>
              <WAButton href={`https://wa.me/${whatsapp}`}>
                +504 3153-4704
              </WAButton>
            </LegalSection>

            {/* Footer note */}
            <p
              className="mt-[clamp(44px,5vw,64px)] pt-6 text-[14px]"
              style={{ borderTop: "1px solid var(--hairline)", color: "var(--ink-soft)" }}
            >
              Última actualización: mayo 2026 · {storeConfig.name}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function LegalSection({
  id,
  num,
  title,
  children,
}: {
  id: string;
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article
      id={id}
      style={{ paddingTop: "clamp(34px, 4vw, 52px)", scrollMarginTop: 96 }}
    >
      <div className="flex items-center gap-4 mb-4">
        <span
          className="w-[42px] h-[42px] rounded-[12px] grid place-items-center flex-none font-bold text-[19px]"
          style={{
            fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
            background: "var(--cream)",
            color: "var(--orange-ink)",
          }}
        >
          {num}
        </span>
        <h2 style={{ fontSize: "clamp(23px, 2.8vw, 31px)" }}>{title}</h2>
      </div>
      {children}
    </article>
  );
}

function LegalP({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3.5" style={{ color: "var(--ink-soft)", fontSize: 17, lineHeight: 1.72 }}>
      {children}
    </p>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-5 rounded-[16px] px-6 py-5 text-[16px] leading-relaxed"
      style={{
        background: "var(--cream)",
        borderLeft: "4px solid var(--orange)",
        color: "var(--ink-soft)",
      }}
    >
      {children}
    </div>
  );
}

function WAButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-full text-white no-underline mt-5"
      style={{ background: "var(--choco-900)" }}
    >
      <BLIcon name="whatsapp" size={20} style={{ color: "#58d684" } as React.CSSProperties} />
      {children}
    </a>
  );
}
