import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Brownie Lab — Hecho a mano, con obsesión';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(150deg, #1c120a 0%, #2a1a0e 45%, #3a2412 100%)',
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 80px', gap: 72,
        }}
      >
        {/* Left: decorative dot grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, opacity: 0.18, flexShrink: 0 }}>
          {[0,1,2,3,4].map(r => (
            <div key={r} style={{ display: 'flex', gap: 14 }}>
              {[0,1,2].map(c => (
                <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: '#e8a23a' }} />
              ))}
            </div>
          ))}
        </div>

        {/* Center: brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e8a23a', letterSpacing: 6, textTransform: 'uppercase', marginBottom: 10 }}>
            🍪 Repostería artesanal
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, color: '#f6ead4', lineHeight: 1, letterSpacing: -3 }}>
            Brownie
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, color: '#d9711e', lineHeight: 1, letterSpacing: -3 }}>
            Lab
          </div>
          <div style={{ width: 80, height: 4, background: '#e8a23a', borderRadius: 2, margin: '22px 0' }} />
          <div style={{ fontSize: 26, color: '#cdb79a', letterSpacing: 1, lineHeight: 1.4 }}>
            Brownies y galletas hechos a mano
          </div>
          <div style={{ fontSize: 22, color: '#cdb79a', letterSpacing: 1 }}>
            con los mejores ingredientes · Honduras 🇭🇳
          </div>
        </div>

        {/* Right: decorative dots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, opacity: 0.18, flexShrink: 0 }}>
          {[0,1,2,3,4].map(r => (
            <div key={r} style={{ display: 'flex', gap: 14 }}>
              {[0,1,2].map(c => (
                <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: '#e8a23a' }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
