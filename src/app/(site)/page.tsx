import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import AnimateIn from "@/components/AnimateIn";
import { storeConfig } from "@/config/store";
import { getProductosPublicos, getEspecialesActivos, getConfiguracion } from "@/lib/data";
import { getTestimoniosPublicos } from "@/actions/testimonios";

export const revalidate = 3600;

function getDaysLeft(fechaInicio: string, duracionDias: number): number {
  const end = new Date(fechaInicio);
  end.setDate(end.getDate() + duracionDias);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default async function Home() {
  const [productos, especiales, config, testimonios] = await Promise.all([
    getProductosPublicos(),
    getEspecialesActivos(),
    getConfiguracion(),
    getTestimoniosPublicos(),
  ]);
  const whatsapp = config?.whatsapp || storeConfig.whatsapp;

  const featured = productos.slice(0, 3);
  const activeSpecials = especiales.filter(
    (e) => getDaysLeft(e.fecha_inicio, e.duracion_dias) > 0
  );

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-900 via-amber-800 to-amber-600 text-white py-16 md:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-amber-300 text-xs font-semibold tracking-[0.25em] uppercase mb-4">
            Hecho a mano · Con obsesión
          </p>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {storeConfig.name}
          </h1>
          <p className="text-amber-100 text-base sm:text-xl mb-10 leading-relaxed max-w-2xl mx-auto">
            Todo empezó con la obsesión perfecta: el brownie ideal. Mientras perfeccionamos
            nuestra receta secreta, te invitamos a probar las galletas que nacieron en el camino.
            <span className="text-amber-300 font-medium"> Spoiler: también son adictivas.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/menu"
              className="bg-white text-amber-800 font-semibold px-8 py-3 rounded-full hover:bg-amber-50 transition-colors"
            >
              Ver Menú
            </Link>
            <Link
              href="/personaliza"
              className="border-2 border-amber-300 text-amber-300 font-semibold px-8 py-3 rounded-full hover:bg-amber-300/10 transition-colors"
            >
              Arma tu postre ✦
            </Link>
          </div>
        </div>
      </section>

      {/* Capricho del Chef */}
      {activeSpecials.length > 0 && (
        <AnimateIn>
        <section className="py-12 md:py-20 px-4 bg-stone-900 text-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                Edición limitada
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold mb-3"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Capricho del Chef
              </h2>
              <p className="text-stone-400 max-w-lg mx-auto">
                Nuevas recetas, cosas que no son comunes en nuestro menú. Nuestra forma de
                poner las cosas experimentalmente — antes de que desaparezcan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {activeSpecials.map((item) => {
                const daysLeft = getDaysLeft(item.fecha_inicio, item.duracion_dias);
                return (
                  <div
                    key={item.id}
                    className="bg-stone-800 border border-stone-700 rounded-2xl p-6 flex flex-col gap-4 hover:border-amber-500/50 transition-colors"
                  >
                    <div className="text-4xl">{item.emoji}</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{item.nombre}</h3>
                      <p className="text-stone-400 text-sm leading-relaxed">{item.descripcion}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-stone-700">
                      <span className="text-amber-400 text-xs font-medium">
                        ⏳ Quedan {daysLeft} {daysLeft === 1 ? "día" : "días"}
                      </span>
                      <a
                        href={`https://wa.me/${whatsapp}?text=Hola! Me interesa el ${item.nombre} del Capricho del Chef`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-amber-600 hover:bg-amber-500 transition-colors px-4 py-1.5 rounded-full font-medium"
                      >
                        Pedir
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        </AnimateIn>
      )}

      {/* Productos destacados */}
      {featured.length > 0 && (
        <AnimateIn delay={100}>
        <section className="py-12 md:py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className="text-3xl md:text-4xl font-bold text-amber-800 mb-3"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Favoritos del Momento
              </h2>
              <p className="text-stone-500">Los más pedidos de la semana</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/menu"
                className="inline-block bg-amber-800 text-white font-semibold px-8 py-3 rounded-full hover:bg-amber-700 transition-colors"
              >
                Ver todo el menú →
              </Link>
            </div>
          </div>
        </section>
        </AnimateIn>
      )}

      {/* Testimonios */}
      {testimonios.length > 0 && (
        <AnimateIn delay={150}>
        <section className="py-12 md:py-20 px-4 bg-stone-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-600 text-xs font-semibold tracking-widest uppercase mb-3">Lo que dicen</p>
              <h2 className="text-3xl md:text-4xl font-bold text-amber-800" style={{ fontFamily: "var(--font-playfair)" }}>
                Nuestros clientes
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {testimonios.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col gap-3">
                  <p className="text-amber-500 text-sm">{'⭐'.repeat(t.estrellas)}</p>
                  <p className="text-stone-600 text-sm leading-relaxed flex-1">&ldquo;{t.texto}&rdquo;</p>
                  <p className="font-semibold text-stone-800 text-sm">— {t.autor}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        </AnimateIn>
      )}

      {/* Instagram */}
      {(config?.instagram || storeConfig.social.instagram) && (
        <section className="py-10 md:py-16 px-4 bg-white">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-2xl mb-3">📸</p>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">Síguenos en Instagram</h2>
            <p className="text-stone-500 mb-6">Mira nuestras creaciones del día y las últimas novedades.</p>
            <a href={config?.instagram || storeConfig.social.instagram} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity">
              Ver perfil en Instagram
            </a>
          </div>
        </section>
      )}

      {/* Arma tu postre CTA */}
      <section className="py-10 md:py-16 px-4 bg-amber-50 border-y border-amber-100">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-amber-600 text-xs font-semibold tracking-widest uppercase mb-3">Nuevo</p>
          <h2
            className="text-3xl font-bold text-amber-800 mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Arma tu postre ideal
          </h2>
          <p className="text-stone-500 mb-8">
            Elige la base y agrégale los toppings que quieras. Míralo antes de pedirlo.
          </p>
          <Link
            href="/personaliza"
            className="inline-block bg-amber-800 text-white font-semibold px-8 py-3 rounded-full hover:bg-amber-700 transition-colors"
          >
            Personalizar ahora ✦
          </Link>
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="bg-amber-800 text-white py-10 md:py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            ¿Tienes alguna pregunta?
          </h2>
          <p className="text-amber-200 mb-8 text-lg">
            Escríbenos por WhatsApp, con gusto te atendemos.
          </p>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-500 hover:bg-green-400 text-white font-semibold px-8 py-3 rounded-full transition-colors"
          >
            💬 Escribir por WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
