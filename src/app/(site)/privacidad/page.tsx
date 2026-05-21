import type { Metadata } from "next";
import { storeConfig } from "@/config/store";

export const metadata: Metadata = { title: "Política de Privacidad" };

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1
        className="text-3xl font-bold text-amber-800 mb-8"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Política de Privacidad
      </h1>

      <div className="prose prose-stone max-w-none space-y-6 text-stone-600">
        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">1. Información que recopilamos</h2>
          <p>
            Al realizar un pedido o contactarnos a través de WhatsApp, recopilamos únicamente la
            información necesaria para procesar tu pedido: <strong>nombre, número de teléfono</strong>
            {" "}y las notas relacionadas con tu pedido.
          </p>
          <p>
            Si utilizas la función de seguimiento de pedido, el número de teléfono que ingresas
            se usa exclusivamente para consultar el estado de tus pedidos y no se almacena en
            sesión ni se comparte con terceros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">2. Cómo usamos tu información</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Procesar y entregar tu pedido</li>
            <li>Comunicarnos contigo sobre el estado de tu pedido por WhatsApp</li>
            <li>Mostrar el estado de tu pedido cuando lo consultas en nuestro sitio</li>
          </ul>
          <p>
            <strong>No</strong> vendemos, alquilamos ni compartimos tu información personal con
            ningún tercero para fines comerciales.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">3. Almacenamiento local</h2>
          <p>
            Nuestro sitio utiliza el almacenamiento local de tu navegador (<em>localStorage</em>)
            para guardar:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Los productos en tu carrito de compras</li>
            <li>Tus productos favoritos</li>
            <li>Productos vistos recientemente</li>
          </ul>
          <p>
            Esta información permanece únicamente en tu dispositivo y se elimina cuando limpias
            el almacenamiento del navegador.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">4. Cookies y servicios externos</h2>
          <p>
            Utilizamos Supabase como base de datos (alojada en servidores de AWS en us-east-1) y
            Vercel para el alojamiento del sitio. Ambos servicios tienen sus propias políticas de
            privacidad. No utilizamos cookies de rastreo ni publicidad de terceros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">5. Tus derechos</h2>
          <p>
            Tienes derecho a solicitar la eliminación de cualquier dato personal que hayamos
            recopilado. Para hacerlo, contáctanos directamente por WhatsApp.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">6. Contacto</h2>
          <p>
            Si tienes preguntas sobre esta política, escríbenos a través de WhatsApp:{" "}
            <a
              href={`https://wa.me/${storeConfig.whatsapp}`}
              className="text-amber-700 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              +{storeConfig.whatsapp}
            </a>
          </p>
        </section>

        <p className="text-xs text-stone-400 pt-4 border-t border-stone-100">
          Última actualización: mayo 2026 · {storeConfig.name}
        </p>
      </div>
    </div>
  );
}
