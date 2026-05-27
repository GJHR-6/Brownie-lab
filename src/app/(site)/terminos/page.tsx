import type { Metadata } from "next";
import { storeConfig } from "@/config/store";

export const metadata: Metadata = { title: "Términos y Condiciones" };

export default function TerminosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1
        className="text-3xl font-bold text-amber-800 mb-8"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Términos y Condiciones
      </h1>

      <div className="prose prose-stone max-w-none space-y-6 text-stone-600">
        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">1. Aceptación</h2>
          <p>
            Al realizar un pedido en {storeConfig.name} aceptas estos términos y condiciones.
            Si no estás de acuerdo con alguno de ellos, por favor no realices tu pedido.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">2. Productos y pedidos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Todos nuestros productos son elaborados artesanalmente y pueden variar ligeramente en apariencia.</li>
            <li>Los pedidos quedan confirmados una vez que recibas confirmación por WhatsApp de nuestra parte.</li>
            <li>Nos reservamos el derecho de cancelar un pedido si el producto no está disponible.</li>
            <li>Las imágenes del sitio son referenciales; el producto final puede diferir levemente.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">3. Precios y pagos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Los precios están expresados en {storeConfig.currency} y pueden cambiar sin previo aviso.</li>
            <li>El pago se realiza según el método acordado al confirmar el pedido (efectivo, transferencia o Tigo Money).</li>
            <li>En caso de transferencia, el pedido se procesa al recibir el comprobante de pago.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">4. Entrega</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Los tiempos de entrega son estimados y pueden variar según la demanda.</li>
            <li>Para entregas a domicilio, el costo y la zona de cobertura se coordinan por WhatsApp.</li>
            <li>No nos hacemos responsables por demoras causadas por información de entrega incorrecta proporcionada por el cliente.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">5. Cancelaciones y devoluciones</h2>
          <p>
            Dado que nuestros productos son perecederos y elaborados bajo pedido, no aceptamos
            devoluciones una vez confirmado el pedido. Si hay un problema con la calidad del producto,
            contáctanos por WhatsApp dentro de las 24 horas siguientes a la entrega.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">6. Responsabilidad</h2>
          <p>
            {storeConfig.name} no se hace responsable por reacciones alérgicas si el cliente
            no informó sus alergias al momento de realizar el pedido. Es responsabilidad del
            cliente proporcionar esta información antes de confirmar la compra.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">7. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento.
            Los cambios entran en vigor al publicarse en este sitio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-stone-800 mb-2">8. Contacto</h2>
          <p>
            Para cualquier consulta sobre estos términos, escríbenos por WhatsApp:{" "}
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
