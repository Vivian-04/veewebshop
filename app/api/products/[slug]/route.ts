import { apiError, corsPreflight, json } from "@/lib/api";
import { productJson } from "@/lib/api-json";
import { sql, type Product } from "@/lib/db";

export const OPTIONS = corsPreflight;

/** One product by its slug. Public. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const [product] = await sql<Product[]>`SELECT * FROM products WHERE slug = ${slug}`;
    if (!product) return apiError("Product not found.", 404);
    return json({ product: productJson(product) });
  } catch (err) {
    console.error("GET /api/products/[slug] failed", err);
    return apiError("Couldn't load this product.", 500);
  }
}
