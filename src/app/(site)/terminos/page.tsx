import type { Metadata } from "next";
import { storeConfig } from "@/config/store";
import BLIcon from "@/components/BLIcon";
import LegalIndex from "@/components/LegalIndex";
import { LegalSection, LegalP, WAButton } from "@/components/LegalComponents";

export const metadata: Metadata = { title: "Términos y Condiciones" };

const SECTIONS = [
  { id: "t1", label: "Aceptación" },
  { id: "t2", label: "Productos y pedidos" },
  { id: "t3", label: "Precios y pagos" },
  { id: "t4", label: "Entrega" },
  { id: "t5", label: "Cancelaciones y devoluciones" },
  { id: "t6", label: "Responsabilidad" },
  { id: "t7", label: "Modificaciones" },
  { id: "t8", label: "Contacto" },
];

export default function TerminosPage() {
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
            <BLIcon name="brownie" size={15} />
            Lo legal, sin letra chica
          </span>
          <h1
            className="font-extrabold mt-4 mb-4"
            style={{ fontSize: "clamp(34px, 5vw, 60px)", color: "var(--on-dark)" }}
          >
            Términos y Condiciones
          </h1>
          <p style={{ color: "var(--on-dark-soft)", fontSize: "clamp(16px, 1.4vw, 19px)", marginInline: "auto" }}>
            Las reglas claras de cómo pedimos, horneamos y entregamos. Al hacer un pedido,
            aceptas estos términos.
          </p>
        </div>
      </section>

      {/* Legal body */}
      <section style={{ paddingBlock: "clamp(48px, 6vw, 80px) clamp(64px, 9vw, 120px)" }}>
        <div
          className="mx-auto px-[var(--gutter)] grid gap-[clamp(40px,6vw,88px)] items-start lg:grid-cols-[248px_1fr]"
          style={{ maxWidth: "var(--maxw)" }}
        >
          <div className="hidden lg:block">
            <LegalIndex sections={SECTIONS} />
          </div>

          <div style={{ maxWidth: "72ch" }}>
            {/* Meta bar */}
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
              <span>Aplica a todos los pedidos hechos en Brownie Lab.</span>
            </div>

            <LegalSection id="t1" num="1" title="Aceptación">
              <LegalP>
                Al realizar un pedido en Brownie Lab aceptas estos términos y condiciones. Si no
                estás de acuerdo con alguno de ellos, por favor no realices tu pedido.
              </LegalP>
            </LegalSection>

            <LegalSection id="t2" num="2" title="Productos y pedidos">
              <ul className="legal-list">
                <li>
                  Todos nuestros productos son elaborados artesanalmente y pueden variar
                  ligeramente en apariencia.
                </li>
                <li>
                  Los pedidos quedan confirmados una vez que recibas confirmación por WhatsApp
                  de nuestra parte.
                </li>
                <li>
                  Nos reservamos el derecho de cancelar un pedido si el producto no está
                  disponible.
                </li>
                <li>
                  Las imágenes del sitio son referenciales; el producto final puede diferir
                  levemente.
                </li>
              </ul>
            </LegalSection>

            <LegalSection id="t3" num="3" title="Precios y pagos">
              <ul className="legal-list">
                <li>
                  Los precios están expresados en <strong>HNL</strong> y pueden cambiar sin
                  previo aviso.
                </li>
                <li>
                  El pago se realiza según el método acordado al confirmar el pedido (efectivo
                  o transferencia bancaria).
                </li>
                <li>
                  En caso de transferencia, el pedido se procesa al recibir el comprobante de
                  pago.
                </li>
              </ul>
            </LegalSection>

            <LegalSection id="t4" num="4" title="Entrega">
              <ul className="legal-list">
                <li>Los tiempos de entrega son estimados y pueden variar según la demanda.</li>
                <li>
                  Para entregas a domicilio, el costo y la zona de cobertura se coordinan por
                  WhatsApp.
                </li>
                <li>
                  No nos hacemos responsables por demoras causadas por información de entrega
                  incorrecta proporcionada por el cliente.
                </li>
              </ul>
            </LegalSection>

            <LegalSection id="t5" num="5" title="Cancelaciones y devoluciones">
              <LegalP>
                Dado que nuestros productos son perecederos y elaborados bajo pedido, no aceptamos
                devoluciones una vez confirmado el pedido. Si hay un problema con la calidad del
                producto, contáctanos por WhatsApp dentro de las{" "}
                <strong>24 horas</strong> siguientes a la entrega.
              </LegalP>
            </LegalSection>

            <LegalSection id="t6" num="6" title="Responsabilidad">
              <LegalP>
                Brownie Lab no se hace responsable por reacciones alérgicas si el cliente no
                informó sus alergias al momento de realizar el pedido. Es responsabilidad del
                cliente proporcionar esta información antes de confirmar la compra.
              </LegalP>
            </LegalSection>

            <LegalSection id="t7" num="7" title="Modificaciones">
              <LegalP>
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los
                cambios entran en vigor al publicarse en este sitio.
              </LegalP>
            </LegalSection>

            <LegalSection id="t8" num="8" title="Contacto">
              <LegalP>
                Para cualquier consulta sobre estos términos, escríbenos por WhatsApp.
              </LegalP>
              <WAButton href={`https://wa.me/${whatsapp}`}>+504 3153-4704</WAButton>
            </LegalSection>

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
