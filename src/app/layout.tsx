import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { storeConfig } from "@/config/store";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://brownielabhn.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    template: `%s | ${storeConfig.name}`,
    default: `${storeConfig.name} — Brownies y galletas artesanales en Honduras`,
  },
  description: storeConfig.description,
  keywords: ['brownie', 'galletas artesanales', 'brownies Honduras', 'repostería Honduras', 'Brownie Lab', 'postres artesanales', 'galletas mantequilla'],
  authors: [{ name: storeConfig.name }],
  openGraph: {
    type: 'website',
    siteName: storeConfig.name,
    locale: 'es_HN',
    url: BASE,
    title: `${storeConfig.name} — Brownies y galletas artesanales`,
    description: storeConfig.description,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: storeConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${storeConfig.name} — Brownies y galletas artesanales`,
    description: storeConfig.description,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable} h-full`}>
      <head>
        {/* Reduce DNS + TCP handshake time to Supabase on first load */}
        <link rel="preconnect" href="https://qktwbasgiwkconmwiwwk.supabase.co" />
        <link rel="dns-prefetch" href="https://qktwbasgiwkconmwiwwk.supabase.co" />
      </head>
      <body
        className="min-h-full flex flex-col antialiased"
        style={{
          fontFamily: "var(--font-dm-sans, 'DM Sans'), system-ui, -apple-system, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
