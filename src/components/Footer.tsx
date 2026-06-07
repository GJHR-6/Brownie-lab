import Link from "next/link";
import { storeConfig } from "@/config/store";
import { getConfiguracion } from "@/lib/data";
import BLIcon from "@/components/BLIcon";

export default async function Footer() {
  const config = await getConfiguracion();
  const whatsapp = config?.whatsapp || storeConfig.whatsapp;
  const instagram = config?.instagram || storeConfig.social.instagram;
  const facebook = config?.facebook || storeConfig.social.facebook;

  return (
    <footer style={{ background: "var(--choco-950)", color: "var(--on-dark-soft)" }}>
      {/* Top grid */}
      <div
        className="mx-auto grid gap-10 px-[var(--gutter)] bl-grid-4col"
        style={{
          maxWidth: "var(--maxw)",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          paddingBlock: "clamp(48px, 6vw, 72px)",
        }}
      >
        {/* Brand column */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 no-underline"
            style={{ color: "var(--amber)" }}
          >
            <BLIcon name="mark" size={32} />
            <span
              className="font-extrabold text-[21px] tracking-tight"
              style={{
                fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
                color: "var(--on-dark)",
              }}
            >
              Brownie Lab
            </span>
          </Link>
          <p
            className="mt-4 text-[14px] leading-relaxed"
            style={{ maxWidth: "34ch", color: "var(--on-dark-soft)" }}
          >
            Pequeña tienda artesanal especializada en galletas y brownies hechos
            con los mejores ingredientes. Horneado con amor, cada galleta cuenta.
          </p>
          <div className="flex gap-2.5 mt-5">
            {/* Instagram — próximamente */}
            <span
              aria-label="Instagram — próximamente"
              title="Instagram — próximamente"
              className="w-[42px] h-[42px] rounded-full grid place-items-center border"
              style={{ color: "var(--hairline-dark)", borderColor: "var(--hairline-dark)", opacity: 0.4, cursor: "not-allowed" }}
            >
              <BLIcon name="instagram" size={20} />
            </span>
            {/* Facebook — próximamente */}
            <span
              aria-label="Facebook — próximamente"
              title="Facebook — próximamente"
              className="w-[42px] h-[42px] rounded-full grid place-items-center border"
              style={{ color: "var(--hairline-dark)", borderColor: "var(--hairline-dark)", opacity: 0.4, cursor: "not-allowed" }}
            >
              <BLIcon name="facebook" size={20} />
            </span>
            {/* TikTok — próximamente */}
            <span
              aria-label="TikTok — próximamente"
              title="TikTok — próximamente"
              className="w-[42px] h-[42px] rounded-full grid place-items-center border"
              style={{ color: "var(--hairline-dark)", borderColor: "var(--hairline-dark)", opacity: 0.4, cursor: "not-allowed" }}
            >
              <BLIcon name="tiktok" size={20} />
            </span>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-[42px] h-[42px] rounded-full grid place-items-center border transition-colors no-underline"
                style={{ color: "var(--on-dark-soft)", borderColor: "var(--hairline-dark)" }}
              >
                <BLIcon name="whatsapp" size={20} />
              </a>
            )}
          </div>
        </div>

        {/* Tienda */}
        <FooterCol title="Tienda">
          <FooterLink href="/menu">Menú</FooterLink>
          <FooterLink href="/personaliza">Personaliza</FooterLink>
          <FooterLink href="/menu">Capricho del Chef</FooterLink>
          <FooterLink href="/#club">Club Brownie Lab</FooterLink>
        </FooterCol>

        {/* Brownie Lab */}
        <FooterCol title="Brownie Lab">
          <FooterLink href="/contact">Nosotros</FooterLink>
          <FooterLink href="/cart">Carrito</FooterLink>
          <FooterLink href="/seguimiento">Seguimiento</FooterLink>
          <FooterLink href="/privacidad">Privacidad</FooterLink>
          <FooterLink href="/terminos">Términos</FooterLink>
        </FooterCol>

        {/* Contacto */}
        <FooterCol title="Contacto">
          {whatsapp && (
            <FooterLink href={`https://wa.me/${whatsapp}`} external icon="whatsapp">
              +504 3153-4704
            </FooterLink>
          )}
          <FooterLink href="#" icon="pin">Honduras</FooterLink>
          <FooterLink href="#" icon="clock">Pedidos 24h antes</FooterLink>
        </FooterCol>
      </div>

      {/* Bottom bar */}
      <div
        className="mx-auto flex justify-between items-center flex-wrap gap-4 px-[var(--gutter)] py-[22px] text-[13px]"
        style={{
          maxWidth: "var(--maxw)",
          borderTop: "1px solid var(--hairline-dark)",
        }}
      >
        <span>© {new Date().getFullYear()} Brownie Lab — Horneado con amor.</span>
        <div className="flex gap-5">
          <Link href="/privacidad" className="no-underline transition-colors hover:text-[var(--amber)]" style={{ color: "var(--on-dark-soft)" }}>Privacidad</Link>
          <Link href="/terminos" className="no-underline transition-colors hover:text-[var(--amber)]" style={{ color: "var(--on-dark-soft)" }}>Términos</Link>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4
        className="text-[13px] font-bold tracking-[0.14em] uppercase mb-4"
        style={{ color: "var(--on-dark)" }}
      >
        {title}
      </h4>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  icon?: "whatsapp" | "pin" | "clock";
}) {
  const cls = "flex items-center gap-2 text-[14px] py-1.5 no-underline transition-colors";
  const style = { color: "var(--on-dark-soft)" };
  const content = (
    <>
      {icon && <BLIcon name={icon} size={15} />}
      {children}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={cls} style={style}>
      {content}
    </Link>
  );
}
