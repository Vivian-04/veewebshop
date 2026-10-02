import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

// No custom title: non-admins get a 404, and the tab title shouldn't hint that this area exists.
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <div className="admin-bar">
        <h1>Shop admin</h1>
        <nav className="chips" aria-label="Admin sections">
          <Link href="/admin" className="chip">Orders</Link>
          <Link href="/admin/products" className="chip">Products &amp; stock</Link>
        </nav>
      </div>
      {children}
    </>
  );
}
