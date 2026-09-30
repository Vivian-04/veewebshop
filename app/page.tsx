import Image from "next/image";
import Link from "next/link";
import { sql, type Product } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await sql<Product[]>`SELECT * FROM products ORDER BY created_at, id`;

  return (
    <>
      <section className="hero">
        <h1>Small-batch goods for the home</h1>
        <p>Made carefully, shipped quickly.</p>
      </section>
      {products.length === 0 ? (
        <p className="empty">No products yet. Run <code>npm run db:setup</code> to seed the catalogue.</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`} className="card">
              <div className="card-img">
                {p.image_url && <Image src={p.image_url} alt={p.name} fill sizes="(max-width: 760px) 100vw, 260px" />}
              </div>
              <div className="card-body">
                <div>
                  <h3>{p.name}</h3>
                  {p.stock <= 0 && <span className="muted">Sold out</span>}
                </div>
                <span className="price">{formatPrice(p.price_cents)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
