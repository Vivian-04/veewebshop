import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/auth";
import { sql, type Order, type OrderItem } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const [{ id }, { placed }] = await Promise.all([params, searchParams]);
  const user = await currentUser();
  if (!user) redirect(`/api/auth/signin?callbackUrl=/orders/${id}`);

  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  // Scoped to the current user so people can't view each other's orders.
  const [order] = await sql<Order[]>`SELECT * FROM orders WHERE id = ${orderId} AND user_id = ${user.id}`;
  if (!order) notFound();
  const items = await sql<OrderItem[]>`
    SELECT product_id, product_name, unit_cents, quantity FROM order_items WHERE order_id = ${order.id} ORDER BY id`;

  return (
    <>
      <h1>Order #{order.id}</h1>
      {placed && (
        <div className="alert success">
          Thank you! Your order has been placed.
          {order.email_sent_at ? ` A confirmation email is on its way to ${user.email}.` : ""}
        </div>
      )}
      <div className="two-col">
        <div className="panel">
          {items.map((i) => (
            <div key={i.product_id} className="summary-row">
              <span>{i.product_name} × {i.quantity}</span>
              <span>{formatPrice(i.unit_cents * i.quantity)}</span>
            </div>
          ))}
          <div className="summary-row total"><span>Total</span><span>{formatPrice(order.total_cents)}</span></div>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Shipping to</h3>
          <p style={{ margin: 0 }}>
            {order.shipping_name}<br />
            {order.shipping_address}<br />
            {order.shipping_city} {order.shipping_postal}<br />
            {order.shipping_country}
          </p>
          <p className="muted">
            Placed {order.created_at.toLocaleString()} · <span style={{ textTransform: "capitalize" }}>{order.status}</span>
          </p>
        </div>
      </div>
      <p><Link href="/orders" className="muted">← All orders</Link></p>
    </>
  );
}
