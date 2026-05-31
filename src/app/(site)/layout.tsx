import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BannerBar from "@/components/BannerBar";
import { getBannersActivos } from "@/lib/data";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const banners = await getBannersActivos();
  const activeBanner = banners[0] ?? null;

  return (
    <>
      {activeBanner && (
        <BannerBar mensaje={activeBanner.mensaje} bannerId={activeBanner.id} />
      )}
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
