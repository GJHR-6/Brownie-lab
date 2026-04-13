import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { storeConfig } from "@/config/store";
import products from "@/data/products.json";

export default function Home() {
  const featured = products.filter((p) => p.available).slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-800 to-amber-600 text-white py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-amber-200 text-sm font-medium tracking-widest uppercase mb-3">
            Hecho a mano con amor
          </p>
          <h1
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {storeConfig.name}
          </h1>
          <p className="text-amber-100 text-xl mb-10 leading-relaxed max-w-xl mx-auto">
            {storeConfig.tagline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/menu"
              className="bg-white text-amber-800 font-semibold px-8 py-3 rounded-full hover:bg-amber-50 transition-colors"
            >
              Ver Menú
            </Link>
            <Link
              href="/cart"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-white/10 transition-colors"
            >
              Mi Carrito 🛒
            </Link>
          </div>
        </div>
      </section>

      {/* Historia */}
      <section className="py-20 px-4 bg-amber-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl font-bold text-amber-800 mb-6"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Nuestra Historia
          </h2>
          <p className="text-stone-600 text-lg leading-relaxed mb-4">
            {storeConfig.description}
          </p>
          <p className="text-stone-500 text-base leading-relaxed">
            Todo comenzó en nuestra cocina, con la receta de la abuela y el
            deseo de compartir algo especial. Hoy cada galleta sigue siendo
            elaborada a mano, con ingredientes frescos y mucho cariño.
          </p>
        </div>
      </section>

      {/* Productos destacados */}
      <section className="py-20 px-4">
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

      {/* CTA WhatsApp */}
      <section className="bg-amber-800 text-white py-16 px-4">
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
            href={`https://wa.me/${storeConfig.whatsapp}`}
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
