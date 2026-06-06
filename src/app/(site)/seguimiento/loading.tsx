export default function SeguimientoLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div
        style={{
          background: "linear-gradient(150deg, var(--choco-900) 0%, var(--choco-700) 100%)",
          paddingBlock: "clamp(48px, 7vw, 76px)",
        }}
      >
        <div className="mx-auto px-[var(--gutter)] text-center" style={{ maxWidth: "var(--maxw)" }}>
          <div className="mx-auto mb-3 rounded-full" style={{ width: 80, height: 14, background: "rgba(255,255,255,.1)" }} />
          <div className="mx-auto mb-3 rounded-full" style={{ width: 220, height: 36, background: "rgba(255,255,255,.12)" }} />
          <div className="mx-auto rounded-full" style={{ width: 280, height: 18, background: "rgba(255,255,255,.08)" }} />
        </div>
      </div>

      {/* Search card skeleton */}
      <div className="mx-auto px-[var(--gutter)]" style={{ maxWidth: "var(--maxw)", paddingBlock: "clamp(40px, 5vw, 64px)" }}>
        <div
          className="mx-auto rounded-[24px] p-6 -mt-8 animate-pulse"
          style={{ maxWidth: 620, background: "var(--paper-card)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="rounded-full mb-3" style={{ width: 140, height: 18, background: "var(--cream)" }} />
          <div className="rounded-full mb-4" style={{ width: "80%", height: 14, background: "var(--cream)" }} />
          <div className="rounded-[16px]" style={{ height: 52, background: "var(--cream)" }} />
        </div>
      </div>
    </>
  );
}
