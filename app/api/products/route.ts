import { apiError, corsPreflight, json } from "@/lib/api";
import { productJson } from "@/lib/api-json";
import { sql, type Product } from "@/lib/db";

export const OPTIONS = corsPreflight;

/** All products (optionally `?category=Beauty`), plus the list of categories. Public. */
export async function GET(req: Request) {
  try {
    const category = new URL(req.url).searchParams.get("category");
    const [products, categories] = await Promise.all([
      category
        ? sql<Product[]>`SELECT * FROM products WHERE category = ${category} ORDER BY id`
        : sql<Product[]>`SELECT * FROM products ORDER BY id`,
      sql<{ category: string }[]>`SELECT DISTINCT category FROM products ORDER BY category`,
    ]);
    return json({ products: products.map(productJson), categories: categories.map((c) => c.category) });
  } catch (err) {
    console.error("GET /api/products failed", err);
    return apiError("Couldn't load products.", 500);
  }
}
