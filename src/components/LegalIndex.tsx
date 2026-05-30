"use client";

import { useEffect, useState } from "react";

interface Section {
  id: string;
  label: string;
}

export default function LegalIndex({ sections }: { sections: Section[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActiveId(e.target.id);
            break;
          }
        }
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  return (
    <aside style={{ position: "sticky", top: 96 }}>
      <span
        className="block mb-4 text-[12px] font-bold tracking-[0.22em] uppercase"
        style={{ color: "var(--orange)" }}
      >
        En esta página
      </span>
      <ol className="legal-index-nav">
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} data-active={activeId === s.id ? "true" : undefined}>
              {s.label}
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
