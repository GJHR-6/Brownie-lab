/* Brownie Lab — topping art (ported from brownie-art.js) */

/* SVG gradient / clip-path defs shared by all topping drawings */
export const brownieDefs = `
<linearGradient id="topG" x1="180" y1="142" x2="180" y2="202" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#6a4324"/><stop offset=".55" stop-color="#4a2c14"/><stop offset="1" stop-color="#34200f"/>
</linearGradient>
<linearGradient id="cakeL" x1="52" y1="172" x2="180" y2="280" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#946039"/><stop offset="1" stop-color="#4c2e14"/>
</linearGradient>
<linearGradient id="cakeR" x1="308" y1="172" x2="180" y2="280" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#693f20"/><stop offset="1" stop-color="#331d0d"/>
</linearGradient>
<linearGradient id="cookTop" x1="180" y1="196" x2="180" y2="256" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#d99a4d"/><stop offset="1" stop-color="#bd7e35"/>
</linearGradient>
<radialGradient id="blub" cx=".38" cy=".34" r=".75">
  <stop offset="0" stop-color="#6a86d6"/><stop offset=".55" stop-color="#3f5bb0"/><stop offset="1" stop-color="#26397f"/>
</radialGradient>
<radialGradient id="rasp" cx=".4" cy=".35" r=".75">
  <stop offset="0" stop-color="#e85f76"/><stop offset="1" stop-color="#b32e46"/>
</radialGradient>
<radialGradient id="strawG" cx=".5" cy=".4" r=".72">
  <stop offset="0" stop-color="#ffdce0"/><stop offset=".5" stop-color="#f6889b"/><stop offset="1" stop-color="#e2455c"/>
</radialGradient>
<linearGradient id="almSliceG" x1="0" y1="-1" x2="0" y2="1">
  <stop offset="0" stop-color="#f5e6c2"/><stop offset="1" stop-color="#e7d0a3"/>
</linearGradient>
<linearGradient id="oreoG" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#332520"/><stop offset="1" stop-color="#1c1310"/>
</linearGradient>
<linearGradient id="plateG" x1="40" y1="230" x2="320" y2="290" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#f3ede4"/><stop offset="1" stop-color="#e3d8c8"/>
</linearGradient>
<linearGradient id="dripG" x1="180" y1="168" x2="180" y2="300" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#43280f"/><stop offset=".5" stop-color="#2e1909"/><stop offset="1" stop-color="#1c0e05"/>
</linearGradient>
<linearGradient id="carmG" x1="110" y1="148" x2="250" y2="196" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#f2c170"/><stop offset="1" stop-color="#cf8b2c"/>
</linearGradient>
<radialGradient id="topSheen" cx=".44" cy=".30" r=".64">
  <stop offset="0" stop-color="rgba(255,232,190,.52)"/>
  <stop offset=".6" stop-color="rgba(255,228,180,.16)"/>
  <stop offset="1" stop-color="rgba(255,228,180,0)"/>
</radialGradient>
<linearGradient id="chipG" x1=".32" y1="0" x2=".55" y2="1">
  <stop offset="0" stop-color="#71492a"/><stop offset=".5" stop-color="#48280f"/><stop offset="1" stop-color="#28150a"/>
</linearGradient>
<linearGradient id="pecanG" x1=".3" y1="0" x2=".62" y2="1">
  <stop offset="0" stop-color="#e7b673"/><stop offset=".55" stop-color="#cf9650"/><stop offset="1" stop-color="#b27634"/>
</linearGradient>
<linearGradient id="mallowG" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#fbf3e8"/><stop offset="1" stop-color="#efe0cd"/>
</linearGradient>
<clipPath id="clipFaceL"><path d="M52,172 L180,202 L180,280 L52,250 Z"/></clipPath>
<clipPath id="clipFaceR"><path d="M180,202 L308,172 L308,250 L180,280 Z"/></clipPath>
<clipPath id="clipTop"><path d="M180,142 L308,172 L180,202 L52,172 Z"/></clipPath>
<clipPath id="clipCookieTop"><ellipse cx="180" cy="226" rx="128" ry="30"/></clipPath>`;

/* ── Topping drawing functions (SVG strings, centered at 0,0) ── */

function pecan(): string {
  const rot = (Math.random() * 300 - 150).toFixed(1);
  const s = (0.86 + Math.random() * 0.22).toFixed(2);
  return `
<ellipse cx="0" cy="13" rx="${(11 * +s).toFixed(1)}" ry="3.4" fill="rgba(0,0,0,.2)"/>
<g transform="rotate(${rot}) scale(${s})">
  <g stroke="#7a4a1e" stroke-linejoin="round">
    <path d="M0,-15 C7.5,-12 10,-2 8,8 C6,13 2,15 0,15 C-2,15 -6,13 -8,8 C-10,-2 -7.5,-12 0,-15 Z"
          fill="url(#pecanG)" stroke-width="1.7"/>
    <path d="M0,-13 C1.6,-6 1.6,7 0,13.5" stroke="#6e4019" stroke-width="2.3" fill="none" stroke-linecap="round"/>
    <g stroke="#8a5a26" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".9">
      <path d="M-4.2,-10 C-6,-3 -6,4 -4.2,11"/>
      <path d="M4.2,-10 C6,-3 6,4 4.2,11"/>
      <path d="M-2,-12 C-3,-5 -3,6 -2,13"/>
      <path d="M2,-12 C3,-5 3,6 2,13"/>
    </g>
    <g stroke="#efc98c" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85">
      <path d="M-5.6,-7 C-7,-1 -7,4 -5.6,9"/>
      <path d="M5.6,-7 C7,-1 7,4 5.6,9"/>
      <path d="M-1,-10 C-1.4,-4 -1.4,5 -1,11"/>
    </g>
  </g>
</g>`;
}

function chocolate(): string {
  return `
<ellipse cx="1" cy="13" rx="12" ry="3.6" fill="rgba(0,0,0,.22)"/>
<path d="M-3,-13.5 C-5.4,-15.4 -9,-14.4 -9.2,-11.2 C-9.4,-8.6 -7,-7.4 -5,-8.6
  C-7,-6.8 -10.4,-3 -12,2.2 C-13.8,8 -8.6,12.8 -0.5,13.2
  C7.6,13.6 13.8,8.8 13.2,2 C12.6,-4.8 6.8,-10 1,-12.4
  C-0.4,-13 -1.8,-13.4 -3,-13.5 Z"
  fill="url(#chipG)" stroke="#190c05" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M-5,-8.6 C-7,-9.3 -7.6,-11.2 -6.4,-12 C-5.3,-12.7 -4,-12 -3.9,-10.7"
  fill="none" stroke="#190c05" stroke-width="1.4" stroke-linecap="round"/>
<path d="M-5.2,-3.6 C-7.2,0.4 -7.4,5.4 -5.6,8.8 C-3.8,6.2 -1.4,2 -0.6,-2.2 C0,-5.4 -3.2,-5.8 -5.2,-3.6 Z"
  fill="rgba(128,82,46,.5)" stroke="none"/>
<ellipse cx="-3.4" cy="0.6" rx="1.7" ry="4" fill="rgba(170,116,68,.45)" transform="rotate(16 -3.4 0.6)"/>`;
}

function mms(): string {
  function candy(x: number, y: number, rot: number, top: string, base: string, shade: string) {
    return `<g transform="translate(${x},${y}) rotate(${rot})">
      <ellipse cx="0" cy="6.6" rx="10" ry="2.8" fill="rgba(0,0,0,.22)"/>
      <ellipse cx="0" cy="0" rx="10.4" ry="7.6" fill="${base}" stroke="${shade}" stroke-width="1.3"/>
      <ellipse cx="0" cy="-1.3" rx="8.8" ry="5.6" fill="${top}"/>
      <ellipse cx="-2.8" cy="-3.1" rx="3.4" ry="1.7" fill="rgba(255,255,255,.55)"/>
      <text x="0" y="2.3" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="6.6" font-weight="800" fill="rgba(255,255,255,.92)">m</text>
    </g>`;
  }
  return `<ellipse cx="0" cy="12" rx="17" ry="4.4" fill="rgba(0,0,0,.24)"/>
    ${candy(-7, 3, -13, '#e23b34', '#bf201b', '#7c0f0c')}
    ${candy(8, 1.5, 15, '#ffd83b', '#e7ad12', '#9c7400')}
    ${candy(0.5, -5, 4, '#37c269', '#199048', '#0c5e2d')}`;
}

function marshmallow(): string {
  function mallow(cx: number, cy: number, s: number) {
    return `<g transform="translate(${cx},${cy}) scale(${s})">
      <rect x="-7" y="-9" width="14" height="18" rx="6" fill="url(#mallowG)" stroke="#5a3a22" stroke-width="1.5"/>
      <path d="M-5.4,-4 C-2,-2.2 2.4,-2.2 5.4,-4.2" fill="none" stroke="#5a3a22" stroke-width="1.1" opacity=".65"/>
      <path d="M3.6,-6.6 C5.6,-3.5 5.8,3 3.8,7" fill="none" stroke="rgba(150,110,78,.28)" stroke-width="2.6" stroke-linecap="round"/>
      <ellipse cx="-2.2" cy="-5.6" rx="2.6" ry="1.3" fill="rgba(255,255,255,.75)"/>
    </g>`;
  }
  return `<ellipse cx="0" cy="12" rx="15" ry="3.8" fill="rgba(0,0,0,.18)"/>
    ${mallow(-6, 3, 0.9)}${mallow(8, 2, 0.82)}${mallow(1, -3, 1.0)}`;
}

function coconut(): string {
  let seed = 987654321;
  function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  const shadow = `<ellipse cx="0" cy="9" rx="17" ry="4" fill="rgba(0,0,0,.1)"/>`;
  const shreds: { y: number; svg: string }[] = [];
  for (let i = 0; i < 30; i++) {
    const x = (rnd() - 0.5) * 34;
    const y = (rnd() - 0.5) * 18;
    const len = 4 + rnd() * 5;
    const rot = rnd() * 180 - 90;
    const shaded = rnd() < 0.25;
    const col = shaded ? '#ece2d2' : '#ffffff';
    const stk = shaded ? '#bfa472' : '#c9b083';
    shreds.push({ y, svg: `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot.toFixed(0)})"><rect x="${(-len/2).toFixed(1)}" y="-1.05" width="${len.toFixed(1)}" height="2.1" rx="1.05" fill="${col}" stroke="${stk}" stroke-width="0.5"/></g>` });
  }
  shreds.sort((a, b) => a.y - b.y);
  return `<g class="coco">${shadow}${shreds.map(s => s.svg).join('')}</g>`;
}

function salt(): string {
  function flake(x: number, y: number, s: number) {
    return `<g transform="translate(${x},${y}) rotate(16) scale(${s})">
      <rect x="-3" y="-3" width="6" height="6" rx="1.3" fill="#fbfdfd" stroke="#aebfc0" stroke-width="1.1"/>
      <path d="M-3,-0.5 h6 M0.2,-3 v6" stroke="#d7e2e2" stroke-width="0.9"/>
    </g>`;
  }
  return `<ellipse cx="0" cy="8" rx="11" ry="3.4" fill="rgba(0,0,0,.18)"/>
    ${flake(-5, -2, 1)}${flake(5, -3, .85)}${flake(1, 3, 1.12)}${flake(8, 2, .72)}`;
}

function almond(): string {
  function slice(x: number, y: number, s: number, rot: number) {
    return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">
      <ellipse cx="0" cy="0" rx="11" ry="4.2" fill="url(#almSliceG)" stroke="#c6a164" stroke-width="1"/>
      <path d="M-10.2,-0.7 A11,4.2 0 0 1 10.2,-0.7" fill="none" stroke="#b67a3f" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M-9.4,-1.2 A11,4.2 0 0 1 9.4,-1.2" fill="none" stroke="#8f5a28" stroke-width="0.8" stroke-linecap="round" opacity=".6"/>
      <line x1="-6.4" y1="0.6" x2="6.4" y2="0.6" stroke="#d8bd88" stroke-width="0.8"/>
      <ellipse cx="-3.2" cy="-1.4" rx="3" ry="1" fill="rgba(255,255,255,.45)"/>
    </g>`;
  }
  return `
<ellipse cx="0" cy="13" rx="16" ry="4.4" fill="rgba(0,0,0,.24)"/>
${slice(-5, 6, 0.82, -14)}
${slice(7, 4, 0.78, 22)}
${slice(-7, -1, 0.72, 8)}
${slice(1, -2, 0.96, -3)}
${slice(6, -7, 0.7, 30)}`;
}

function oreoCrumbs(): string {
  function chunk(x: number, y: number, r: number, rot: number) {
    return `<g transform="translate(${x},${y}) rotate(${rot})">
      <path d="M${-r},${-r*0.66} L${r*0.62},${-r} L${r},${r*0.5} L${r*0.2},${r} L${-r*0.82},${r*0.62} Z"
            fill="url(#oreoG)" stroke="#120c0a" stroke-width="1" stroke-linejoin="round"/>
      <ellipse cx="${-r*0.18}" cy="${-r*0.2}" rx="${r*0.32}" ry="${r*0.2}" fill="rgba(120,98,88,.4)"/>
    </g>`;
  }
  return `<ellipse cx="0" cy="12" rx="14" ry="4" fill="rgba(0,0,0,.22)"/>
    ${chunk(-6, 2, 5.2, 12)}
    ${chunk(5, 4, 4.4, -22)}
    ${chunk(2, -3, 5.6, 8)}
    ${chunk(-3.5, -5, 3.6, -32)}
    ${chunk(8, -1, 3.6, 42)}
    <circle cx="-0.5" cy="3.4" r="2" fill="#f5efe2"/>
    <circle cx="6.4" cy="-4" r="1.6" fill="#f7f1e6"/>
    <rect x="-8.4" y="-2.4" width="3.4" height="2.4" rx="0.8" fill="#f3ecdd" transform="rotate(18 -8.4 -2.4)"/>`;
}

function strawberry(): string {
  function slice(x: number, y: number, s: number, rot: number) {
    const seedPts = [[0,-7.6],[-4,-5.6],[4,-5.6],[-5.8,-1.6],[5.8,-1.6],[-4.2,2.4],[4.2,2.4],[-1.8,6],[1.8,6]];
    const seeds = seedPts.map(p => `<ellipse cx="${p[0]}" cy="${p[1]}" rx="0.85" ry="1.5" fill="#f6da7c"/>`).join('');
    return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">
      <path d="M0,-12 C8,-12.5 11,-5 8.5,3 C6.6,9 2.6,12.8 0,13.4 C-2.6,12.8 -6.6,9 -8.5,3 C-11,-5 -8,-12.5 0,-12 Z"
            fill="#e2455c" stroke="#b3243a" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M0,-9 C6,-9.4 8.4,-3.6 6.4,2.6 C4.8,7.4 2,10.6 0,11 C-2,10.6 -4.8,7.4 -6.4,2.6 C-8.4,-3.6 -6,-9.4 0,-9 Z"
            fill="url(#strawG)"/>
      <path d="M0,-6.4 C1.8,-2.4 1.8,4 0,8.4 C-1.8,4 -1.8,-2.4 0,-6.4 Z" fill="#fff4f3" opacity=".85"/>
      ${seeds}
      <ellipse cx="-3" cy="-4.4" rx="2.4" ry="1.3" fill="rgba(255,255,255,.5)"/>
    </g>`;
  }
  return `<ellipse cx="0" cy="13" rx="14" ry="4.2" fill="rgba(0,0,0,.24)"/>
    ${slice(-5, 2, 0.78, -18)}${slice(6, -2, 0.94, 14)}`;
}

/* ── Topping map & ordering ── */

export const toppingArt: Record<string, () => string> = {
  'Nueces': pecan,
  'Chispas de Chocolate': chocolate,
  "M&M's": mms,
  'Marshmallows': marshmallow,
  'Coco Rallado': coconut,
  'Sal de Mar': salt,
  'Almendras': almond,
  'Oreo Crumbs': oreoCrumbs,
  'Fresas': strawberry,
};

export const order = [
  'Nueces', 'Chispas de Chocolate', "M&M's", 'Marshmallows',
  'Coco Rallado', 'Sal de Mar', 'Almendras', 'Oreo Crumbs', 'Fresas',
];

/* ── Spot positions (viewBox 360×320) ── */

export const brownieSpots: [number, number][] = [
  [185, 92], [150, 100], [220, 100], [128, 112],
  [185, 112], [240, 112], [152, 126], [188, 128], [222, 126],
];

export const cookieSpots: [number, number][] = [
  [176, 98], [128, 110], [224, 110], [104, 130],
  [176, 128], [246, 132], [126, 150], [180, 156], [228, 148],
];

export function spots(kind: string): [number, number][] {
  return kind === 'galleta' ? cookieSpots : brownieSpots;
}

/* Mini icon SVG string for topping card swatches (uses stable/seeded art, no Math.random) */
export function toppingIcon(name: string): string {
  const fn = toppingArt[name];
  if (!fn) return '';
  return `<svg class="tc-art" viewBox="-19 -20 38 40" xmlns="http://www.w3.org/2000/svg" style="width:42px;height:44px">${fn()}</svg>`;
}

/* Stable icon variant for SSR — replaces Math.random() calls with fixed values so
   server and client HTML match during hydration. */
function pecanStable(): string {
  const rot = '22.5';
  const s = '0.94';
  return `
<ellipse cx="0" cy="13" rx="${(11 * 0.94).toFixed(1)}" ry="3.4" fill="rgba(0,0,0,.2)"/>
<g transform="rotate(${rot}) scale(${s})">
  <g stroke="#7a4a1e" stroke-linejoin="round">
    <path d="M0,-15 C7.5,-12 10,-2 8,8 C6,13 2,15 0,15 C-2,15 -6,13 -8,8 C-10,-2 -7.5,-12 0,-15 Z"
          fill="url(#pecanG)" stroke-width="1.7"/>
    <path d="M0,-13 C1.6,-6 1.6,7 0,13.5" stroke="#6e4019" stroke-width="2.3" fill="none" stroke-linecap="round"/>
    <g stroke="#8a5a26" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".9">
      <path d="M-4.2,-10 C-6,-3 -6,4 -4.2,11"/>
      <path d="M4.2,-10 C6,-3 6,4 4.2,11"/>
      <path d="M-2,-12 C-3,-5 -3,6 -2,13"/>
      <path d="M2,-12 C3,-5 3,6 2,13"/>
    </g>
    <g stroke="#efc98c" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85">
      <path d="M-5.6,-7 C-7,-1 -7,4 -5.6,9"/>
      <path d="M5.6,-7 C7,-1 7,4 5.6,9"/>
      <path d="M-1,-10 C-1.4,-4 -1.4,5 -1,11"/>
    </g>
  </g>
</g>`;
}

const stableArt: Record<string, () => string> = {
  ...toppingArt,
  'Nueces': pecanStable,
};

export function toppingIconStable(name: string): string {
  const fn = stableArt[name];
  if (!fn) return '';
  return `<svg class="tc-art" viewBox="-19 -20 38 40" xmlns="http://www.w3.org/2000/svg" style="width:42px;height:44px">${fn()}</svg>`;
}

/* Distribute n spots across k groups (left-to-right, sorted by x) */
export function chunkSpots(
  allSpots: [number, number][],
  selected: string[],
): { name: string; spot: [number, number] }[] {
  if (selected.length === 0) return [];
  const sorted = [...allSpots].sort((a, b) => a[0] - b[0]);
  const k = selected.length;
  const n = sorted.length;
  const base = Math.floor(n / k);
  const rem = n % k;
  const placements: { name: string; spot: [number, number] }[] = [];
  let i = 0;
  for (let g = 0; g < k; g++) {
    const size = base + (g < rem ? 1 : 0);
    const grp = sorted.slice(i, i + size);
    i += size;
    grp.forEach(spot => placements.push({ name: selected[g], spot }));
  }
  // z-order: smaller y goes behind (rendered first)
  placements.sort((a, b) => a.spot[1] - b.spot[1]);
  return placements;
}
