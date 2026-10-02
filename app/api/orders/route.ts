import { apiError, corsPreflight, json, readJson, withUser } from "@/lib/api";
import { orderJson } from "@/lib/api-json";
import { placeOrderFromCart, type CheckoutInput } from "@/lib/checkout";
import { sql, type Order } from "@/lib/db";

export const OPTIONS = corsPreflight;

/** The signed-in user's orders, newest first. */
export function GET(req: Request) {
  return withUser(req, async (user) => {
    const orders = await sql<(Order & { item_count: number })[]>`
      SELECT o.*, (SELECT COALESCE(SUM(quantity), 0)::int FROM order_items WHERE order_id = o.id) AS item_count
      FROM orders o WHERE o.user_id = ${user.id} ORDER BY o.created_at DESC`;
    return json({ orders: orders.map(orderJson) });
  });
}

/** Checkout: { zone, shipping: { name, phone, address }, saveToProfile }. Uses the saved cart. */
export function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson<CheckoutInput>(req);
    if (!body) return apiError("Invalid request.", 400);
    const result = await placeOrderFromCart(user, { zone: body.zone, shipping: body.shipping, saveToProfile: body.saveToProfile });
    if ("error" in result) return apiError(result.error, 400);
    return json(result, 201);
  });
}
