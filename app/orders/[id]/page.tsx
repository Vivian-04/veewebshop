import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/auth";
import { sql, type Order, type OrderItem } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/format";
import { SHIPPING_ZONES } from "@/lib/shipping";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const [{ id }, { placed }] = await Promise.all([params, searchParams]);
  const user = await currentUser();
  if (!user) redirect(`/signin?callbackUrl=/orders/${encodeURIComponent(id)}`);

  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  // Scoped to the current user so people can't view each other's orders.
  const [order] = await sql<Order[]>`SELECT * FROM orders WHERE id = ${orderId} AND user_id = ${user.id}`;
  if (!order) notFound();
  const items = await sql<(OrderItem & { slug: string; image_url: string | null })[]>`
    SELECT oi.product_id, oi.product_name, oi.unit_kobo, oi.quantity, p.slug, p.image_url
    FROM order_items oi JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ${order.id} ORDER BY oi.id`;

  return (
    <>
      <h1>Order #{order.id}</h1>
      {placed && (
        <div className="alert success">
          Thank you! Your order has been placed. We&apos;ll call {order.shipping_phone} to arrange delivery.
          {/* email_sent_at only means our email provider accepted the message; delivery isn't guaranteed. */}
          {order.email_sent_at
            ? ` We're sending a confirmation email to ${user.email}. If it doesn't arrive, check your spam folder. Your order is saved either way, and you can always find it on your profile.`
            : " You can always find this order on your profile."}
        </div>
      )}
      <div className="two-col">
        <div className="panel">
          {items.map((i) => (
            <div key={i.product_id} className="line compact">
              <Link href={`/products/${i.slug}`} className="line-img" aria-label={`View ${i.product_name}`}>
                {i.image_url && <Image src={i.image_url} alt={i.product_name} fill sizes="48px" />}
              </Link>
              <Link href={`/products/${i.slug}`} className="line-info">{i.product_name} × {i.quantity}</Link>
              <span>{formatPrice(i.unit_kobo * i.quantity)}</span>
            </div>
          ))}
          <div className="summary-row" style={{ marginTop: 8 }}><span>Subtotal</span><span>{formatPrice(order.subtotal_kobo)}</span></div>
          <div className="summary-row">
            <span>Delivery ({SHIPPING_ZONES[order.shipping_zone].label})</span>
            <span>{formatPrice(order.shipping_kobo)}</span>
          </div>
          <div className="summary-row total"><span>Total</span><span>{formatPrice(order.total_kobo)}</span></div>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Delivering to</h3>
          <p style={{ margin: 0, whiteSpace: "pre-line" }}>
            <strong>{order.shipping_name}</strong>
            {"\n"}{order.shipping_phone}
            {"\n"}{order.shipping_address}
            {"\n"}{SHIPPING_ZONES[order.shipping_zone].label}
          </p>
          <p className="muted">
            Placed {formatDateTime(order.created_at)} · <span className={`status ${order.status}`}>{order.status}</span>
          </p>
          <p className="muted small">Payment on delivery.</p>
        </div>
      </div>
      <p><Link href="/profile" className="text-link">← Back to my profile</Link></p>
    </>
  );
}
