'use client';

import { useRouter } from 'next/navigation';

interface Props {
  periodo: string;
  periodos: Record<string, string>;
  basePath?: string;
}

export default function DashboardPeriodTabs({ periodo, periodos, basePath = '/admin' }: Props) {
  const router = useRouter();

  return (
    <div style={{ display: 'inline-flex', background: 'var(--cream-200)', borderRadius: 'var(--r-pill)', padding: 4, gap: 2 }}>
      {Object.entries(periodos).map(([key, label]) => {
        const active = periodo === key;
        return (
          <button
            key={key}
            onClick={() => router.push(`${basePath}?periodo=${key}`)}
            style={{
              fontSize: 13, fontWeight: 600, padding: '7px 18px',
              borderRadius: 'var(--r-pill)', border: 'none', cursor: 'pointer',
              background: active ? 'var(--paper-card)' : 'none',
              color: active ? 'var(--ink)' : 'var(--ink-soft)',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              transition: '.15s',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
