import type { Order, Product } from "./db";

// The JSON shapes the API returns (camelCase, money in kobo).

export function productJson(p: Product) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    category: p.category,
    priceKobo: p.price_kobo,
    imageUrl: p.image_url,
    stock: p.stock,
  };
}

export function orderJson(o: Order & { item_count?: number }) {
  return {
    id: o.id,
    status: o.status,
    subtotalKobo: o.subtotal_kobo,
    shippingKobo: o.shipping_kobo,
    totalKobo: o.total_kobo,
    zone: o.shipping_zone,
    shipping: { name: o.shipping_name, phone: o.shipping_phone, address: o.shipping_address },
    itemCount: o.item_count,
    createdAt: o.created_at,
  };
}
