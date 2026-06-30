import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BannerBar from "@/components/BannerBar";
import { getBannersActivos, getConfiguracion } from "@/lib/data";
import { storeConfig } from "@/config/store";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://brownielabhn.com').replace(/\/$/, '');

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [banners, config] = await Promise.all([getBannersActivos(), getConfiguracion()]);
  const activeBanner = banners[0] ?? null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: config?.nombre ?? storeConfig.name,
    description: config?.descripcion ?? storeConfig.description,
    url: BASE,
    telephone: `+${storeConfig.whatsapp}`,
    image: `${BASE}/opengraph-image`,
    menu: `${BASE}/menu`,
    servesCuisine: ['Brownies artesanales', 'Galletas artesanales', 'Repostería'],
    priceRange: '$$',
    currenciesAccepted: 'HNL',
    paymentAccepted: 'Efectivo, Transferencia bancaria',
    ...(config?.ubicacion && {
      address: { '@type': 'PostalAddress', streetAddress: config.ubicacion, addressCountry: 'HN' },
      hasMap: `https://maps.google.com/?q=${encodeURIComponent(config.ubicacion)}`,
    }),
    ...(config?.horario_atencion && { openingHours: config.horario_atencion }),
    sameAs: [
      config?.instagram || storeConfig.social.instagram,
      config?.facebook  || storeConfig.social.facebook,
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {activeBanner && <BannerBar mensaje={activeBanner.mensaje} bannerId={activeBanner.id} />}
      <Navbar logoUrl={config?.logo_url ?? null} storeName={config?.nombre ?? storeConfig.name} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
