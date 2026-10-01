import Image from "next/image";
import { notFound } from "next/navigation";
import { sql, type Product } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { AddToCartButton } from "@/components/AddToCartButton";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product] = await sql<Product[]>`SELECT * FROM products WHERE slug = ${slug}`;
  if (!product) notFound();

  return (
    <div className="product">
      {product.image_url ? (
        <a
          href={product.image_url.replace(/\?.*$/, "")}
          target="_blank"
          rel="noopener noreferrer"
          className="product-img"
          title="Open full-size image"
        >
          <Image src={product.image_url} alt={product.name} fill priority sizes="(max-width: 760px) 100vw, 520px" />
        </a>
      ) : (
        <div className="product-img" />
      )}
      <div>
        <h1>{product.name}</h1>
        <span className="price">{formatPrice(product.price_cents)}</span>
        <p>{product.description}</p>
        <p className="muted">{product.stock > 0 ? `${product.stock} in stock` : "Currently sold out"}</p>
        <AddToCartButton
          stock={product.stock}
          item={{
            productId: product.id,
            slug: product.slug,
            name: product.name,
            priceCents: product.price_cents,
            imageUrl: product.image_url,
          }}
        />
      </div>
    </div>
  );
}
