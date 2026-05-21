import type { MetadataRoute } from 'next';

const BASE = 'https://brownie-lab.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                   lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/menu`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/personaliza`,  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/contact`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
}
