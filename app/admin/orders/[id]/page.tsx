import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { notFound } from "next/navigation";
import { sql, type Order, type OrderItem } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, isOrderStatus, statusLabel } from "@/lib/orders";
import { SHIPPING_ZONES } from "@/lib/shipping";
import { updateOrderStatus } from "../../actions";

const ACTION_LABELS: Record<string, string> = {
  confirmed: "Confirm order",
  dispatched: "Mark out for delivery",
  delivered: "Mark delivered (paid)",
  cancelled: "Cancel order",
};

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const orderId = Number((await params).id);
  if (!Number.isInteger(orderId)) notFound();

  const [order] = await sql<(Order & { customer_email: string })[]>`
    SELECT o.*, u.email AS customer_email FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ${orderId}`;
  if (!order) notFound();
  const items = await sql<OrderItem[]>`
    SELECT product_id, product_name, unit_kobo, quantity FROM order_items WHERE order_id = ${orderId} ORDER BY id`;

  const next = isOrderStatus(order.status) ? ORDER_STATUSES[order.status].next : [];
  const phoneDigits = order.shipping_phone.replace(/\D/g, "");

  return (
    <>
      <p className="breadcrumb"><Link href="/admin">← All orders</Link></p>
      <div className="admin-order-head">
        <h2>Order #{order.id}</h2>
        <span className={`status ${order.status}`}>{statusLabel(order.status)}</span>
        <span className="muted small">Placed {formatDateTime(order.created_at)}</span>
      </div>

      <div className="two-col">
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Items</h3>
          {items.map((i) => (
            <div key={i.product_id} className="summary-row">
              <span>{i.product_name} × {i.quantity}</span>
              <span>{formatPrice(i.unit_kobo * i.quantity)}</span>
            </div>
          ))}
          <div className="summary-row" style={{ marginTop: 8 }}><span>Subtotal</span><span>{formatPrice(order.subtotal_kobo)}</span></div>
          <div className="summary-row">
            <span>Delivery ({SHIPPING_ZONES[order.shipping_zone].label})</span>
            <span>{formatPrice(order.shipping_kobo)}</span>
          </div>
          <div className="summary-row total"><span>Collect on delivery</span><span>{formatPrice(order.total_kobo)}</span></div>

          {next.length > 0 && (
            <div className="admin-actions">
              {next.map((s) => (
                <form key={s} action={updateOrderStatus.bind(null, order.id, s)}>
                  <button className={`btn ${s === "cancelled" ? "danger" : "primary"}`}>{ACTION_LABELS[s]}</button>
                </form>
              ))}
            </div>
          )}
          {order.status === "cancelled" && <p className="muted small">Cancelled. Items were returned to stock.</p>}
        </div>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Customer</h3>
          <p style={{ margin: 0, whiteSpace: "pre-line" }}>
            <strong>{order.shipping_name}</strong>
            {"\n"}<a className="text-link" href={`tel:${order.shipping_phone}`}>{order.shipping_phone}</a>
            {"\n"}<a className="text-link" href={`mailto:${order.customer_email}`}>{order.customer_email}</a>
          </p>
          <p style={{ whiteSpace: "pre-line" }}>
            {order.shipping_address}
            {"\n"}{SHIPPING_ZONES[order.shipping_zone].label}
          </p>
          <a className="btn small" href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer">
            Message on WhatsApp
          </a>
          <p className="muted small">
            Confirmation email: {order.email_sent_at ? `accepted by Mailgun ${formatDateTime(order.email_sent_at)}` : "not sent"}
          </p>
        </div>
      </div>
    </>
  );
}
