export type BLIconName =
  | "mark" | "brownie" | "cart" | "search" | "nav-menu" | "close"
  | "arrow-right" | "plus" | "minus" | "heart" | "star" | "clock"
  | "sparkle" | "leaf" | "truck" | "pin" | "instagram" | "facebook"
  | "whatsapp" | "tiktok" | "share";

interface BLIconProps extends React.SVGProps<SVGSVGElement> {
  name: BLIconName;
  size?: number;
}

const paths: Record<BLIconName, React.ReactNode> = {
  mark: (
    <>
      <path d="M12.5 4h7" />
      <path d="M13.5 4.4v6.3L7.1 23.3c-.7 1.3.2 3 1.7 3h14.4c1.5 0 2.4-1.7 1.7-3L18.5 10.7V4.4" />
      <path d="M10.4 18.5h11.2" />
      <circle cx={13} cy={22} r={1.05} fill="currentColor" stroke="none" />
      <circle cx={17.4} cy={21.4} r={1.05} fill="currentColor" stroke="none" />
      <circle cx={15.4} cy={24.2} r={1.05} fill="currentColor" stroke="none" />
    </>
  ),
  brownie: (
    <>
      <rect x={5} y={9} width={22} height={16} rx={3.5} />
      <path d="M5 14.5h22" />
      <circle cx={11} cy={19.8} r={1.15} fill="currentColor" stroke="none" />
      <circle cx={16} cy={20.8} r={1.15} fill="currentColor" stroke="none" />
      <circle cx={21} cy={19.3} r={1.15} fill="currentColor" stroke="none" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2.2l1.7 11.2a1.5 1.5 0 0 0 1.5 1.3h8.6a1.5 1.5 0 0 0 1.47-1.18L20.4 7H6.2" />
      <circle cx={9.5} cy={20} r={1.4} fill="currentColor" stroke="none" />
      <circle cx={18} cy={20} r={1.4} fill="currentColor" stroke="none" />
    </>
  ),
  search: (
    <>
      <circle cx={11} cy={11} r={7} />
      <path d="M20 20l-3.8-3.8" />
    </>
  ),
  "nav-menu": <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  heart: (
    <path d="M12 20s-7-4.6-9.2-9C1.3 7.7 3 4.5 6.2 4.5c2 0 3.2 1.1 3.8 2.2.6-1.1 1.8-2.2 3.8-2.2 3.2 0 4.9 3.2 3.4 6.5C19 15.4 12 20 12 20z" />
  ),
  star: (
    <path d="M12 3.5l2.6 5.3 5.9.86-4.25 4.14 1 5.86L12 17.9l-5.25 2.76 1-5.86L3.5 9.66l5.9-.86z" />
  ),
  clock: (
    <>
      <circle cx={12} cy={12} r={8.5} />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3c.4 3.6 1.4 4.6 5 5-3.6.4-4.6 1.4-5 5-.4-3.6-1.4-4.6-5-5 3.6-.4 4.6-1.4 5-5z" />
      <path d="M19 13.5c.2 1.6.7 2.1 2.3 2.3-1.6.2-2.1.7-2.3 2.3-.2-1.6-.7-2.1-2.3-2.3 1.6-.2 2.1-.7 2.3-2.3z" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-13 14-13 0 9-5 13-13 13H5z" />
      <path d="M5 19c3-4 6-6 9-7.5" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7" />
      <circle cx={7} cy={18} r={1.7} />
      <circle cx={17.5} cy={18} r={1.7} />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.5-5.6 6.5-10.5A6.5 6.5 0 0 0 5.5 10.5C5.5 15.4 12 21 12 21z" />
      <circle cx={12} cy={10.5} r={2.3} />
    </>
  ),
  instagram: (
    <>
      <rect x={3.5} y={3.5} width={17} height={17} rx={5} />
      <circle cx={12} cy={12} r={4} />
      <circle cx={16.8} cy={7.2} r={1.05} fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <path
      fill="currentColor"
      stroke="none"
      d="M13.5 21v-7h2.4l.45-3H13.5V9.1c0-.85.25-1.4 1.45-1.4H16.5V5.1C16.2 5.05 15.2 5 14.1 5 11.8 5 10.2 6.4 10.2 9v2H7.8v3h2.4v7z"
    />
  ),
  whatsapp: (
    <>
      <path d="M4 20l1.3-4A8 8 0 1 1 8.5 19L4 20z" />
      <path
        fill="currentColor"
        stroke="none"
        d="M9 9.2c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.7 1.5c.1.2 0 .4-.1.6l-.4.5c-.2.2-.2.4-.1.6.3.6 1.2 1.6 2.2 2 .2.1.4.1.6-.1l.5-.6c.2-.2.4-.2.6-.1l1.5.7c.3.2.4.3.4.5 0 .6-.3 1.3-1.2 1.5-1 .2-2.3 0-4-1.3-1.6-1.3-2.5-2.8-2.7-3.8-.1-.7 0-1.3.4-1.7z"
      />
    </>
  ),
  tiktok: (
    <path
      fill="currentColor"
      stroke="none"
      d="M19.5 8.2a5.5 5.5 0 0 1-3.5-1.2v7.5a5.5 5.5 0 1 1-4-5.3v3.1a2.5 2.5 0 1 0 1.7 2.4V3h3.1a5.5 5.5 0 0 0 2.7 5.2z"
    />
  ),
  share: (
    <>
      <circle cx={6} cy={12} r={2.4} />
      <circle cx={18} cy={6} r={2.4} />
      <circle cx={18} cy={18} r={2.4} />
      <path d="M8.1 10.9l7.8-3.8M8.1 13.1l7.8 3.8" />
    </>
  ),
};

const meta: Record<BLIconName, { vb: string; sw: number }> = {
  mark:        { vb: "0 0 32 32", sw: 2 },
  brownie:     { vb: "0 0 32 32", sw: 2 },
  cart:        { vb: "0 0 24 24", sw: 1.8 },
  search:      { vb: "0 0 24 24", sw: 1.8 },
  "nav-menu":  { vb: "0 0 24 24", sw: 1.8 },
  close:       { vb: "0 0 24 24", sw: 1.8 },
  "arrow-right": { vb: "0 0 24 24", sw: 1.8 },
  plus:        { vb: "0 0 24 24", sw: 1.8 },
  minus:       { vb: "0 0 24 24", sw: 1.8 },
  heart:       { vb: "0 0 24 24", sw: 1.8 },
  star:        { vb: "0 0 24 24", sw: 1.8 },
  clock:       { vb: "0 0 24 24", sw: 1.8 },
  sparkle:     { vb: "0 0 24 24", sw: 1.8 },
  leaf:        { vb: "0 0 24 24", sw: 1.8 },
  truck:       { vb: "0 0 24 24", sw: 1.8 },
  pin:         { vb: "0 0 24 24", sw: 1.8 },
  instagram:   { vb: "0 0 24 24", sw: 1.8 },
  facebook:    { vb: "0 0 24 24", sw: 0 },
  whatsapp:    { vb: "0 0 24 24", sw: 1.8 },
  tiktok:      { vb: "0 0 24 24", sw: 0 },
  share:       { vb: "0 0 24 24", sw: 1.8 },
};

export default function BLIcon({ name, size = 20, className = "", ...rest }: BLIconProps) {
  const { vb, sw } = meta[name];
  return (
    <svg
      viewBox={vb}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`flex-none shrink-0 ${className}`}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
