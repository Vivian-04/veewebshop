"use server";

import { after } from "next/server";
import { currentUser } from "@/auth";
import { adminEmails } from "@/lib/admin";
import { sql, type Order, type OrderItem, type Product } from "@/lib/db";
import { sendNewOrderNotification, sendOrderConfirmation } from "@/lib/mailgun";
import { SHIPPING_ZONES, isShippingZone, normalizeNigerianPhone, type ShippingZone } from "@/lib/shipping";

type PlaceOrderInput = {
  items: { productId: number; quantity: number }[];
  zone: ShippingZone;
  shipping: { name: string; phone: string; address: string };
  saveToProfile: boolean;
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

  if (!isShippingZone(input.zone)) return { error: "Please choose Lagos Island or Mainland for delivery." };
  // The fee always comes from the server, never from the client.
  const shippingKobo = SHIPPING_ZONES[input.zone].feeKobo;

  const name = String(input.shipping?.name ?? "").trim().slice(0, 100);
  const address = String(input.shipping?.address ?? "").trim().slice(0, 500);
  const phone = normalizeNigerianPhone(String(input.shipping?.phone ?? ""));
  if (!name || !address) return { error: "Please fill in your name and delivery address." };
  if (!phone) return { error: "Please enter a valid Nigerian phone number, e.g. 0803 123 4567." };

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
        return { product_id: p.id, product_name: p.name, unit_kobo: p.price_kobo, quantity };
      });
      const subtotal = lines.reduce((n, l) => n + l.unit_kobo * l.quantity, 0);

      const [created] = await tx<Order[]>`
        INSERT INTO orders (user_id, subtotal_kobo, shipping_kobo, total_kobo, shipping_zone, shipping_name, shipping_phone, shipping_address)
        VALUES (${user.id}, ${subtotal}, ${shippingKobo}, ${subtotal + shippingKobo}, ${input.zone}, ${name}, ${phone}, ${address})
        RETURNING *`;

      for (const l of lines) {
        await tx`
          INSERT INTO order_items (order_id, product_id, product_name, unit_kobo, quantity)
          VALUES (${created.id}, ${l.product_id}, ${l.product_name}, ${l.unit_kobo}, ${l.quantity})`;
        await tx`UPDATE products SET stock = stock - ${l.quantity} WHERE id = ${l.product_id}`;
      }

      if (input.saveToProfile) {
        await tx`UPDATE users SET name = ${name}, phone = ${phone}, address = ${address}, zone = ${input.zone} WHERE id = ${user.id}`;
      }

      return [created, lines] as const;
    });
  } catch (err) {
    if (err instanceof CheckoutError) return { error: err.message };
    console.error("placeOrder failed", err);
    return { error: "Something went wrong placing your order. Please try again." };
  }

  // The order is committed. Send emails after responding, so a slow or failing email
  // never delays or breaks the customer's checkout.
  after(async () => {
    try {
      if (await sendOrderConfirmation(user.email, order, items)) {
        await sql`UPDATE orders SET email_sent_at = now() WHERE id = ${order.id}`;
      }
    } catch (err) {
      console.error(`Confirmation email for order ${order.id} failed`, err);
    }
    try {
      await sendNewOrderNotification(adminEmails(), user.email, order, items);
    } catch (err) {
      console.error(`Admin notification for order ${order.id} failed`, err);
    }
  });

  return { orderId: order.id };
}
