import Link from "next/link";
import { storeConfig } from "@/config/store";
import { getConfiguracion } from "@/lib/data";

export default async function Footer() {
  const config = await getConfiguracion();

  const nombre = config?.nombre ?? storeConfig.name;
  const tagline = config?.tagline ?? storeConfig.tagline;

  const socialLinks = [
    { label: "Instagram", href: config?.instagram || storeConfig.social.instagram, icon: "📸" },
    { label: "Facebook", href: config?.facebook || storeConfig.social.facebook, icon: "👍" },
    { label: "TikTok", href: config?.tiktok || storeConfig.social.tiktok, icon: "🎵" },
  ].filter((l) => l.href);

  return (
    <footer className="bg-amber-900 text-amber-100 text-sm mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-base">
            <span>🍪</span>
            <span>{nombre}</span>
          </div>

          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="text-amber-300 hover:text-white transition-colors text-xl"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          )}

          <p className="text-amber-400 text-xs">
            © {new Date().getFullYear()} {nombre}
          </p>
        </div>
        <div className="mt-4 border-t border-amber-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-amber-300 text-xs">{tagline}</p>
          <div className="flex items-center gap-4">
            <Link href="/privacidad" className="text-amber-500 hover:text-amber-300 text-xs transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos" className="text-amber-500 hover:text-amber-300 text-xs transition-colors">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
