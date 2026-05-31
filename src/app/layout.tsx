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

export const metadata: Metadata = {
  title: {
    template: `%s | ${storeConfig.name}`,
    default: storeConfig.name,
  },
  description: storeConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable} h-full`}>
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
