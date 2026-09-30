import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/auth";
import { sql, type Order } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export default async function OrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/api/auth/signin?callbackUrl=/orders");

  const orders = await sql<Order[]>`
    SELECT * FROM orders WHERE user_id = ${user.id} ORDER BY created_at DESC`;

  return (
    <>
      <h1>Your orders</h1>
      {orders.length === 0 ? (
        <div className="empty">
          <p>You haven&apos;t placed any orders yet.</p>
          <Link href="/" className="btn primary">Start shopping</Link>
        </div>
      ) : (
        <div className="panel">
          <table className="orders">
            <thead>
              <tr><th>Order</th><th>Date</th><th>Status</th><th>Total</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/orders/${o.id}`}><strong>#{o.id}</strong></Link></td>
                  <td>{o.created_at.toLocaleDateString()}</td>
                  <td style={{ textTransform: "capitalize" }}>{o.status}</td>
                  <td>{formatPrice(o.total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
