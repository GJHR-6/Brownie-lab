export default function PersonalizaLoading() {
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
          <div className="mx-auto mb-3 rounded-full" style={{ width: 260, height: 36, background: "rgba(255,255,255,.12)" }} />
          <div className="mx-auto rounded-full" style={{ width: 320, height: 18, background: "rgba(255,255,255,.08)" }} />
        </div>
      </div>

      {/* Builder skeleton */}
      <div
        className="mx-auto px-[var(--gutter)]"
        style={{ maxWidth: "var(--maxw)", paddingBlock: "clamp(48px, 6vw, 80px)" }}
      >
        <div className="grid gap-10" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Preview */}
          <div className="rounded-[24px] animate-pulse" style={{ aspectRatio: "1/1", background: "var(--cream)" }} />
          {/* Options */}
          <div className="flex flex-col gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-[16px] animate-pulse" style={{ height: 56, background: "var(--cream)" }} />
            ))}
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-[16px] animate-pulse" style={{ height: 68, background: "var(--cream)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
