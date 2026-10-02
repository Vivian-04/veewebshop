import { apiError, corsPreflight, json, withUser } from "@/lib/api";
import { orderJson } from "@/lib/api-json";
import { sql, type Order, type OrderItem } from "@/lib/db";

export const OPTIONS = corsPreflight;

/** One of the signed-in user's orders, with its items. */
export function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withUser(req, async (user) => {
    const id = Number((await params).id);
    if (!Number.isInteger(id)) return apiError("Order not found.", 404);
    // Scoped to the user, so nobody can read someone else's order by guessing ids.
    const [order] = await sql<Order[]>`SELECT * FROM orders WHERE id = ${id} AND user_id = ${user.id}`;
    if (!order) return apiError("Order not found.", 404);
    const items = await sql<OrderItem[]>`
      SELECT product_id, product_name, unit_kobo, quantity FROM order_items WHERE order_id = ${id} ORDER BY id`;
    return json({
      order: {
        ...orderJson(order),
        items: items.map((i) => ({ productId: i.product_id, name: i.product_name, unitKobo: i.unit_kobo, quantity: i.quantity })),
      },
    });
  });
}
