import { storeConfig } from "@/config/store";

const socialLinks = [
  { label: "Instagram", href: storeConfig.social.instagram, icon: "📸" },
  { label: "Facebook", href: storeConfig.social.facebook, icon: "👍" },
  { label: "TikTok", href: storeConfig.social.tiktok, icon: "🎵" },
].filter((l) => l.href);

export default function Footer() {
  return (
    <footer className="bg-amber-900 text-amber-100 text-sm mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-base">
            <span>🍪</span>
            <span>{storeConfig.name}</span>
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
            © {new Date().getFullYear()} {storeConfig.name}
          </p>
        </div>
        <p className="text-amber-300 text-xs text-center mt-4 border-t border-amber-800 pt-4">
          {storeConfig.tagline}
        </p>
      </div>
    </footer>
  );
}
