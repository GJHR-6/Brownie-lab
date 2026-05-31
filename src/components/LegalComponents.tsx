import BLIcon from "@/components/BLIcon";

export function LegalSection({
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
    <article id={id} style={{ paddingTop: "clamp(34px, 4vw, 52px)", scrollMarginTop: 96 }}>
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

export function LegalP({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3.5" style={{ color: "var(--ink-soft)", fontSize: 17, lineHeight: 1.72 }}>
      {children}
    </p>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-5 rounded-[16px] px-6 py-5 text-[16px] leading-relaxed"
      style={{ background: "var(--cream)", borderLeft: "4px solid var(--orange)", color: "var(--ink-soft)" }}
    >
      {children}
    </div>
  );
}

export function WAButton({ href, children }: { href: string; children: React.ReactNode }) {
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
