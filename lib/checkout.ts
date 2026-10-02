import { after } from "next/server";
import { adminEmails } from "./admin";
import { clearCart } from "./cart";
import { sql, type Order, type OrderItem, type Product, type User } from "./db";
import { sendNewOrderNotification, sendOrderConfirmation } from "./mailgun";
import { SHIPPING_ZONES, isShippingZone, normalizeNigerianPhone } from "./shipping";

export type CheckoutInput = {
  zone: unknown;
  shipping: { name?: unknown; phone?: unknown; address?: unknown } | undefined;
  saveToProfile: unknown;
};

class CheckoutError extends Error {}

/**
 * Turns the user's saved cart into an order. Prices, stock and the delivery fee always come from the
 * database, never the client. Used by POST /api/orders for both the website and the mobile app.
 */
export async function placeOrderFromCart(user: User, input: CheckoutInput): Promise<{ orderId: number } | { error: string }> {
  const zone = input.zone;
  if (!isShippingZone(zone)) return { error: "Please choose Lagos Island or Mainland for delivery." };
  const shippingKobo = SHIPPING_ZONES[zone].feeKobo;

  const name = String(input.shipping?.name ?? "").trim().slice(0, 100);
  const address = String(input.shipping?.address ?? "").trim().slice(0, 500);
  const phone = normalizeNigerianPhone(String(input.shipping?.phone ?? ""));
  if (!name || !address) return { error: "Please fill in your name and delivery address." };
  if (!phone) return { error: "Please enter a valid Nigerian phone number, e.g. 0803 123 4567." };

  let order: Order;
  let items: OrderItem[];
  try {
    [order, items] = await sql.begin(async (tx) => {
      const cart = await tx<{ product_id: number; quantity: number }[]>`
        SELECT product_id, quantity FROM cart_items WHERE user_id = ${user.id} FOR UPDATE`;
      if (cart.length === 0) throw new CheckoutError("Your cart is empty.");

      // Lock the product rows so concurrent checkouts can't oversell stock.
      const products = await tx<Product[]>`
        SELECT * FROM products WHERE id IN ${tx(cart.map((c) => c.product_id))} ORDER BY id FOR UPDATE`;
      const byId = new Map(products.map((p) => [p.id, p]));

      const lines: OrderItem[] = cart.map((c) => {
        const p = byId.get(c.product_id);
        if (!p) throw new CheckoutError("Some items are no longer available.");
        if (p.stock < c.quantity) throw new CheckoutError(`Only ${p.stock} of "${p.name}" left in stock.`);
        return { product_id: p.id, product_name: p.name, unit_kobo: p.price_kobo, quantity: c.quantity };
      });
      const subtotal = lines.reduce((n, l) => n + l.unit_kobo * l.quantity, 0);

      const [created] = await tx<Order[]>`
        INSERT INTO orders (user_id, subtotal_kobo, shipping_kobo, total_kobo, shipping_zone, shipping_name, shipping_phone, shipping_address)
        VALUES (${user.id}, ${subtotal}, ${shippingKobo}, ${subtotal + shippingKobo}, ${zone}, ${name}, ${phone}, ${address})
        RETURNING *`;

      for (const l of lines) {
        await tx`
          INSERT INTO order_items (order_id, product_id, product_name, unit_kobo, quantity)
          VALUES (${created.id}, ${l.product_id}, ${l.product_name}, ${l.unit_kobo}, ${l.quantity})`;
        await tx`UPDATE products SET stock = stock - ${l.quantity} WHERE id = ${l.product_id}`;
      }

      if (input.saveToProfile === true) {
        await tx`UPDATE users SET name = ${name}, phone = ${phone}, address = ${address}, zone = ${zone} WHERE id = ${user.id}`;
      }

      await clearCart(user.id, tx);
      return [created, lines] as const;
    });
  } catch (err) {
    if (err instanceof CheckoutError) return { error: err.message };
    console.error("placeOrderFromCart failed", err);
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
