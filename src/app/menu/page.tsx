import ProductCard from "@/components/ProductCard";
import products from "@/data/products.json";

const categories: Record<string, string> = {
  clasicas: "Clásicas",
  brownies: "Brownies",
  especiales: "Especiales",
};

export default function MenuPage() {
  const grouped = products.reduce<Record<string, typeof products>>(
    (acc, product) => {
      if (!acc[product.category]) acc[product.category] = [];
      acc[product.category].push(product);
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <h1
          className="text-4xl md:text-5xl font-bold text-amber-800 mb-3"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Nuestro Menú
        </h1>
        <p className="text-stone-500 text-lg">
          Todo hecho a mano. Pedidos con 24h de anticipación.
        </p>
      </div>

      {/* Categories */}
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2
              className="text-2xl font-bold text-amber-800"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {categories[category] ?? category}
            </h2>
            <div className="flex-1 h-px bg-amber-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
