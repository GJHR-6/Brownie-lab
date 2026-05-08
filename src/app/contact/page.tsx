import { storeConfig } from "@/config/store";

const valores = [
  {
    titulo: "Calidad",
    descripcion:
      "Usamos solo los mejores ingredientes. Cada brownie y cada galleta pasa por nuestro estándar antes de llegar a ti.",
    icon: "✦",
  },
  {
    titulo: "Artesanal",
    descripcion:
      "Todo se hace a mano, en pequeños lotes. Sin atajos, sin líneas de producción. Solo recetas y dedicación.",
    icon: "🤍",
  },
  {
    titulo: "Pasión",
    descripcion:
      "Brownie Lab nació de una obsesión. Esa misma energía va en cada hornada, en cada detalle del producto.",
    icon: "🔥",
  },
  {
    titulo: "Honestidad",
    descripcion:
      "Lo que ves es lo que recibes. Ingredientes reales, precios justos y trato directo con quien hace tus postres.",
    icon: "🤝",
  },
];

export default function NosotrosPage() {
  const { social, whatsapp, name } = storeConfig;

  const contactLinks = [
    {
      label: "WhatsApp",
      href: `https://wa.me/${whatsapp}`,
      emoji: "💬",
      description: "Escríbenos para hacer pedidos o preguntas",
      color: "bg-green-600 hover:bg-green-500",
      show: !!whatsapp,
    },
    {
      label: "Instagram",
      href: social.instagram,
      emoji: "📸",
      description: "Síguenos para ver nuestras creaciones del día",
      color: "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400",
      show: !!social.instagram,
    },
    {
      label: "Facebook",
      href: social.facebook,
      emoji: "👍",
      description: "Únete a nuestra comunidad",
      color: "bg-blue-600 hover:bg-blue-500",
      show: !!social.facebook,
    },
    {
      label: "TikTok",
      href: social.tiktok,
      emoji: "🎵",
      description: "Mira el proceso de elaboración",
      color: "bg-stone-800 hover:bg-stone-700",
      show: !!social.tiktok,
    },
  ].filter((l) => l.show);

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 text-white py-20 px-4 text-center">
        <p className="text-amber-300 text-xs font-semibold tracking-[0.25em] uppercase mb-4">
          Quiénes somos
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Nosotros
        </h1>
        <p className="text-amber-200 text-lg max-w-xl mx-auto leading-relaxed">
          Una pequeña operación con una obsesión enorme: hacer el mejor brownie que hayas probado.
        </p>
      </section>

      {/* Historia */}
      <section className="py-20 px-4 bg-amber-50">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Decorative block */}
          <div className="flex justify-center md:justify-start">
            <div className="relative w-64 h-64 md:w-72 md:h-72">
              <div className="absolute inset-0 bg-amber-800 rounded-3xl rotate-6 opacity-20" />
              <div className="absolute inset-0 bg-amber-700 rounded-3xl rotate-3 opacity-30" />
              <div className="relative bg-gradient-to-br from-amber-800 to-amber-600 rounded-3xl w-full h-full flex flex-col items-center justify-center gap-3 shadow-xl">
                <span className="text-7xl">🍫</span>
                <p
                  className="text-white font-bold text-xl tracking-wide"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {name}
                </p>
                <p className="text-amber-200 text-xs tracking-widest uppercase">Hecho a mano</p>
              </div>
            </div>
          </div>

          {/* Texto */}
          <div>
            <h2
              className="text-3xl md:text-4xl font-bold text-amber-800 mb-6"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Nuestra Historia
            </h2>
            <p className="text-stone-600 text-lg leading-relaxed mb-4">
              En Brownie Lab, todo empezó con la obsesión perfecta: el brownie ideal. Mientras
              perfeccionamos nuestra receta secreta, te invitamos a probar las galletas que
              nacieron en el camino.
            </p>
            <p className="text-stone-500 leading-relaxed mb-4">
              Spoiler: también son adictivas.
            </p>
            <p className="text-stone-500 leading-relaxed">
              Somos una operación pequeña y honesta. Cada pieza sale de nuestra cocina lista
              para sorprenderte — hecha con ingredientes reales, recetas propias y sin
              apuros. La calidad manda.
            </p>
          </div>
        </div>
      </section>

      {/* Misión & Visión */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-amber-800"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Hacia dónde vamos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Misión */}
            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8">
              <div className="w-12 h-12 bg-amber-800 rounded-2xl flex items-center justify-center text-white text-xl mb-5">
                🎯
              </div>
              <h3
                className="text-xl font-bold text-amber-800 mb-3"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Misión
              </h3>
              <p className="text-stone-600 leading-relaxed">
                Ofrecer postres artesanales elaborados con ingredientes de calidad y mucho cuidado,
                satisfaciendo a quienes buscan algo diferente — honesto, hecho a mano y con sabor
                que se recuerda.
              </p>
            </div>

            {/* Visión */}
            <div className="bg-stone-900 rounded-3xl p-8">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white text-xl mb-5">
                🌟
              </div>
              <h3
                className="text-xl font-bold text-amber-400 mb-3"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Visión
              </h3>
              <p className="text-stone-300 leading-relaxed">
                Ser la referencia en brownies y cookies artesanales, reconocidos por una
                receta que no se consigue en otro lugar — y por una experiencia que vale la pena
                repetir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-20 px-4 bg-amber-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-amber-800"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Lo que nos mueve
            </h2>
            <p className="text-stone-500 mt-2">Los valores detrás de cada hornada</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {valores.map((v) => (
              <div
                key={v.titulo}
                className="bg-white border border-amber-100 rounded-2xl p-6 flex gap-4 hover:border-amber-300 hover:shadow-sm transition-all"
              >
                <span className="text-2xl mt-0.5 flex-shrink-0">{v.icon}</span>
                <div>
                  <h3 className="font-bold text-amber-800 mb-1">{v.titulo}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{v.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-amber-800 mb-2"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Encuéntranos
            </h2>
            <p className="text-stone-500">
              Para pedidos, preguntas o solo saludarnos.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {contactLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${link.color} text-white rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] shadow-sm`}
              >
                <span className="text-3xl">{link.emoji}</span>
                <div>
                  <p className="font-bold">{link.label}</p>
                  <p className="text-white/75 text-sm">{link.description}</p>
                </div>
                <span className="ml-auto text-white/50 text-lg">→</span>
              </a>
            ))}
          </div>

          <div className="mt-10 text-center bg-amber-50 rounded-2xl p-6">
            <p className="text-stone-600 text-sm leading-relaxed">
              <span className="font-semibold text-amber-800">{name}</span> es una tienda artesanal.
              Los pedidos se confirman por WhatsApp y requieren anticipación de 24 horas.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
