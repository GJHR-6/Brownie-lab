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
          background: 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <div style={{ fontSize: 100 }}>🍫</div>
        <div style={{ color: 'white', fontSize: 72, fontWeight: 'bold', letterSpacing: -2 }}>
          Brownie Lab
        </div>
        <div style={{ color: '#fcd34d', fontSize: 32, letterSpacing: 4 }}>
          HECHO A MANO · CON OBSESIÓN
        </div>
      </div>
    ),
    { ...size }
  );
}
