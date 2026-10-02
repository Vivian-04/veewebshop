import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { sql, type Order } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, isOrderStatus, statusLabel, type OrderStatus } from "@/lib/orders";
import { SHIPPING_ZONES } from "@/lib/shipping";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin(); // Layout checks alone don't protect pages, so every admin page checks too.
  const { status } = await searchParams;
  const filter = isOrderStatus(status) ? status : null;

  const [orders, counts] = await Promise.all([
    sql<(Order & { customer_email: string; item_count: number })[]>`
      SELECT o.*, u.email AS customer_email,
        (SELECT COALESCE(SUM(quantity), 0)::int FROM order_items WHERE order_id = o.id) AS item_count
      FROM orders o JOIN users u ON u.id = o.user_id
      ${filter ? sql`WHERE o.status = ${filter}` : sql``}
      ORDER BY o.created_at DESC
      LIMIT 200`,
    sql<{ status: string; n: number }[]>`SELECT status, count(*)::int AS n FROM orders GROUP BY status`,
  ]);
  const countFor = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const total = counts.reduce((n, c) => n + c.n, 0);

  return (
    <>
      <div className="chips" role="navigation" aria-label="Filter by status">
        <Link href="/admin" className={`chip${!filter ? " active" : ""}`}>All ({total})</Link>
        {(Object.keys(ORDER_STATUSES) as OrderStatus[]).map((s) => (
          <Link key={s} href={`/admin?status=${s}`} className={`chip${filter === s ? " active" : ""}`}>
            {ORDER_STATUSES[s].label} ({countFor(s)})
          </Link>
        ))}
      </div>

      <div className="panel">
        {orders.length === 0 ? (
          <p className="empty" style={{ padding: "24px 0" }}>No orders{filter ? ` marked "${statusLabel(filter)}"` : " yet"}.</p>
        ) : (
          <table className="orders">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Delivery</th><th>Status</th><th>Total</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="text-link"><strong>#{o.id}</strong></Link>
                    <div className="muted small">{formatDateTime(o.created_at)}</div>
                  </td>
                  <td>
                    {o.shipping_name}
                    <div className="muted small">{o.shipping_phone}</div>
                  </td>
                  <td>{SHIPPING_ZONES[o.shipping_zone].label.replace("Lagos ", "")}</td>
                  <td><span className={`status ${o.status}`}>{statusLabel(o.status)}</span></td>
                  <td>
                    {formatPrice(o.total_kobo)}
                    <div className="muted small">{o.item_count} item{o.item_count === 1 ? "" : "s"}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
