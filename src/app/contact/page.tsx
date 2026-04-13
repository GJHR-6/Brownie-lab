import { storeConfig } from "@/config/store";

export default function ContactPage() {
  const { social, whatsapp, name } = storeConfig;

  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/${whatsapp}`,
      emoji: "💬",
      description: "Escríbenos directamente para hacer pedidos o preguntas",
      color: "bg-green-500 hover:bg-green-400",
      show: !!whatsapp,
    },
    {
      label: "Instagram",
      href: social.instagram,
      emoji: "📸",
      description: "Síguenos para ver nuestras creaciones del día",
      color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400",
      show: !!social.instagram,
    },
    {
      label: "Facebook",
      href: social.facebook,
      emoji: "👍",
      description: "Únete a nuestra comunidad en Facebook",
      color: "bg-blue-600 hover:bg-blue-500",
      show: !!social.facebook,
    },
    {
      label: "TikTok",
      href: social.tiktok,
      emoji: "🎵",
      description: "Mira el proceso de elaboración de nuestras galletas",
      color: "bg-stone-800 hover:bg-stone-700",
      show: !!social.tiktok,
    },
  ].filter((l) => l.show);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20">
      {/* Header */}
      <div className="text-center mb-14">
        <h1
          className="text-4xl md:text-5xl font-bold text-amber-800 mb-3"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Contáctanos
        </h1>
        <p className="text-stone-500 text-lg">
          Encuéntranos en nuestras redes o escríbenos directo por WhatsApp.
        </p>
      </div>

      {/* Social Links */}
      <div className="flex flex-col gap-4">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${link.color} text-white rounded-2xl p-5 flex items-center gap-5 transition-all hover:scale-[1.02] shadow-sm`}
          >
            <span className="text-4xl">{link.emoji}</span>
            <div>
              <p className="font-bold text-lg">{link.label}</p>
              <p className="text-white/80 text-sm">{link.description}</p>
            </div>
            <span className="ml-auto text-white/60 text-xl">→</span>
          </a>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-12 text-center bg-amber-50 rounded-2xl p-6">
        <p className="text-stone-600 text-sm leading-relaxed">
          <span className="font-semibold text-amber-800">{name}</span> es una
          tienda artesanal. Los pedidos se confirman por WhatsApp y requieren
          anticipación de 24 horas.
        </p>
      </div>
    </div>
  );
}
