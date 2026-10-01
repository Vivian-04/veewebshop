import Image from "next/image";
import Link from "next/link";
import { sql, type Product } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { SHIPPING_ZONES } from "@/lib/shipping";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    category
      ? sql<Product[]>`SELECT * FROM products WHERE category = ${category} ORDER BY id`
      : sql<Product[]>`SELECT * FROM products ORDER BY id`,
    sql<{ category: string }[]>`SELECT DISTINCT category FROM products ORDER BY category`,
  ]);

  return (
    <>
      <section className="hero">
        <h1>Beautiful Nigerian-made goods, delivered across Lagos</h1>
        <p>
          Fabrics, fashion, beauty and home pieces from local makers. Flat delivery:{" "}
          <strong>{formatPrice(SHIPPING_ZONES.mainland.feeKobo)}</strong> on the Mainland,{" "}
          <strong>{formatPrice(SHIPPING_ZONES.island.feeKobo)}</strong> on the Island.
        </p>
      </section>

      <div className="chips" role="navigation" aria-label="Categories">
        <Link href="/" className={`chip${!category ? " active" : ""}`}>All</Link>
        {categories.map((c) => (
          <Link
            key={c.category}
            href={`/?category=${encodeURIComponent(c.category)}`}
            className={`chip${category === c.category ? " active" : ""}`}
          >
            {c.category}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="empty">No products found.</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`} className="card">
              <div className="card-img">
                {p.image_url && <Image src={p.image_url} alt={p.name} fill sizes="(max-width: 760px) 100vw, 260px" />}
                {p.stock <= 0 && <span className="card-tag">Sold out</span>}
              </div>
              <div className="card-body">
                <div>
                  <span className="muted small">{p.category}</span>
                  <h3>{p.name}</h3>
                </div>
                <span className="price">{formatPrice(p.price_kobo)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
