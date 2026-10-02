import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { sql, type Product } from "@/lib/db";
import { ProductRow } from "./ProductRow";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await sql<Product[]>`SELECT * FROM products ORDER BY category, name`;

  return (
    <div className="panel">
      <p className="muted small" style={{ marginTop: 0 }}>
        Change a price (in naira) or the number in stock, then press Save. Items with 0 in stock show as sold out.
      </p>
      {products.map((p) => (
        <div key={p.id} className="admin-product">
          <Link href={`/products/${p.slug}`} className="line-img" aria-label={`View ${p.name}`}>
            {p.image_url && <Image src={p.image_url} alt={p.name} fill sizes="48px" />}
          </Link>
          <div className="admin-product-name">
            <strong>{p.name}</strong>
            <div className="muted small">{p.category}</div>
          </div>
          <ProductRow productId={p.id} priceNaira={p.price_kobo / 100} stock={p.stock} />
        </div>
      ))}
    </div>
  );
}
