"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";
import { canMoveTo, isOrderStatus } from "@/lib/orders";

export type AdminActionState = { error?: string; saved?: boolean };

export async function updateOrderStatus(orderId: number, status: string) {
  await requireAdmin();
  if (!Number.isInteger(orderId) || !isOrderStatus(status)) return;

  await sql.begin(async (tx) => {
    // Lock the order so two admins clicking at once can't, say, restock a cancellation twice.
    const [order] = await tx<{ status: string }[]>`SELECT status FROM orders WHERE id = ${orderId} FOR UPDATE`;
    if (!order || !canMoveTo(order.status, status)) return;

    await tx`UPDATE orders SET status = ${status} WHERE id = ${orderId}`;
    if (status === "cancelled") {
      // Put the items back on the shelf.
      await tx`
        UPDATE products p SET stock = p.stock + oi.quantity
        FROM order_items oi WHERE oi.order_id = ${orderId} AND p.id = oi.product_id`;
    }
  });

  revalidatePath("/admin", "layout");
  revalidatePath(`/orders/${orderId}`);
}

export async function updateProduct(
  productId: number,
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const priceNaira = Number(String(formData.get("price") ?? "").replace(/[₦,\s]/g, ""));
  const stock = Number(formData.get("stock"));

  if (!Number.isFinite(priceNaira) || priceNaira < 0 || priceNaira > 100_000_000) {
    return { error: "Enter a valid price in naira." };
  }
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) return { error: "Stock must be a whole number." };

  await sql`UPDATE products SET price_kobo = ${Math.round(priceNaira * 100)}, stock = ${stock} WHERE id = ${productId}`;
  revalidatePath("/", "layout");
  return { saved: true };
}
