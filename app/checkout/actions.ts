"use server";

import { currentUser } from "@/auth";
import { sql, type Order, type OrderItem, type Product } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/mailgun";

type PlaceOrderInput = {
  items: { productId: number; quantity: number }[];
  shipping: { name: string; address: string; city: string; postal: string; country: string };
};

class CheckoutError extends Error {}

export async function placeOrder(input: PlaceOrderInput): Promise<{ orderId: number } | { error: string }> {
  const user = await currentUser();
  if (!user) return { error: "Please sign in to check out." };

  // Merge duplicate lines and validate quantities.
  const quantities = new Map<number, number>();
  for (const { productId, quantity } of input.items ?? []) {
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { error: "Your cart contains an invalid item." };
    }
    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
  }
  if (quantities.size === 0) return { error: "Your cart is empty." };

  const shipping = Object.fromEntries(
    Object.entries(input.shipping ?? {}).map(([k, v]) => [k, String(v ?? "").trim().slice(0, 200)]),
  ) as PlaceOrderInput["shipping"];
  if (!shipping.name || !shipping.address || !shipping.city || !shipping.postal || !shipping.country) {
    return { error: "Please fill in all shipping fields." };
  }

  let order: Order;
  let items: OrderItem[];
  try {
    [order, items] = await sql.begin(async (tx) => {
      const ids = [...quantities.keys()];
      // Lock the rows so concurrent checkouts can't oversell stock.
      const products = await tx<Product[]>`
        SELECT * FROM products WHERE id IN ${tx(ids)} FOR UPDATE`;

      if (products.length !== ids.length) throw new CheckoutError("Some items are no longer available.");

      const lines: OrderItem[] = products.map((p) => {
        const quantity = quantities.get(p.id)!;
        if (p.stock < quantity) {
          throw new CheckoutError(`Only ${p.stock} of "${p.name}" left in stock.`);
        }
        // Prices always come from the database, never from the client.
        return { product_id: p.id, product_name: p.name, unit_cents: p.price_cents, quantity };
      });
      const total = lines.reduce((n, l) => n + l.unit_cents * l.quantity, 0);

      const [created] = await tx<Order[]>`
        INSERT INTO orders (user_id, total_cents, shipping_name, shipping_address, shipping_city, shipping_postal, shipping_country)
        VALUES (${user.id}, ${total}, ${shipping.name}, ${shipping.address}, ${shipping.city}, ${shipping.postal}, ${shipping.country})
        RETURNING *`;

      for (const l of lines) {
        await tx`
          INSERT INTO order_items (order_id, product_id, product_name, unit_cents, quantity)
          VALUES (${created.id}, ${l.product_id}, ${l.product_name}, ${l.unit_cents}, ${l.quantity})`;
        await tx`UPDATE products SET stock = stock - ${l.quantity} WHERE id = ${l.product_id}`;
      }

      return [created, lines] as const;
    });
  } catch (err) {
    if (err instanceof CheckoutError) return { error: err.message };
    console.error("placeOrder failed", err);
    return { error: "Something went wrong placing your order. Please try again." };
  }

  // The order is committed; a failed email shouldn't fail the checkout.
  try {
    if (await sendOrderConfirmation(user.email, order, items)) {
      await sql`UPDATE orders SET email_sent_at = now() WHERE id = ${order.id}`;
    }
  } catch (err) {
    console.error(`Confirmation email for order ${order.id} failed`, err);
  }

  return { orderId: order.id };
}
