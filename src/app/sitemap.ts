import type { MetadataRoute } from 'next';

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://brownielabhn.com').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                  lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/menu`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/personaliza`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/contact`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/seguimiento`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/terminos`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE}/privacidad`,  lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  ];
}
