import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/auth";
import { Avatar } from "@/components/Avatar";
import { sql, type Order } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { statusLabel } from "@/lib/orders";
import { SHIPPING_ZONES } from "@/lib/shipping";
import { ProfileForm } from "./ProfileForm";

export const metadata = { title: "My profile · ShopWithVee" };

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=/profile");

  const orders = await sql<(Order & { item_count: number })[]>`
    SELECT o.*, (SELECT COALESCE(SUM(quantity), 0)::int FROM order_items WHERE order_id = o.id) AS item_count
    FROM orders o WHERE o.user_id = ${user.id} ORDER BY o.created_at DESC`;
  const totalSpent = orders.reduce((n, o) => n + o.total_kobo, 0);

  return (
    <>
      <section className="profile-header panel">
        <Avatar name={user.name} email={user.email} image={user.image} size={64} />
        <div>
          <h1>{user.name || "My profile"}</h1>
          <div className="muted">{user.email}</div>
          <div className="muted small">Member since {formatDate(user.created_at)}</div>
        </div>
        <div className="stats">
          <div><strong>{orders.length}</strong><span className="muted small">orders</span></div>
          <div><strong>{formatPrice(totalSpent)}</strong><span className="muted small">spent</span></div>
        </div>
      </section>

      <div className="two-col profile-cols">
        <section className="panel" id="orders">
          <h2>My orders</h2>
          {orders.length === 0 ? (
            <div className="empty" style={{ padding: "24px 0" }}>
              <p>You haven&apos;t placed any orders yet.</p>
              <Link href="/" className="btn primary">Start shopping</Link>
            </div>
          ) : (
            <table className="orders">
              <thead>
                <tr><th>Order</th><th>Date</th><th>Delivery</th><th>Status</th><th>Total</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/orders/${o.id}`} className="text-link"><strong>#{o.id}</strong></Link>
                      <div className="muted small">{o.item_count} item{o.item_count === 1 ? "" : "s"}</div>
                    </td>
                    <td>{formatDate(o.created_at)}</td>
                    <td>{SHIPPING_ZONES[o.shipping_zone].label.replace("Lagos ", "")}</td>
                    <td><span className={`status ${o.status}`}>{statusLabel(o.status)}</span></td>
                    <td>{formatPrice(o.total_kobo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h2>My details</h2>
          <p className="muted small" style={{ marginTop: -8 }}>Used to fill in checkout automatically.</p>
          <ProfileForm
            name={user.name ?? ""}
            phone={user.phone ?? ""}
            address={user.address ?? ""}
            zone={user.zone}
          />
        </section>
      </div>
    </>
  );
}
