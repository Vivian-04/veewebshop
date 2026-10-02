import type { Metadata } from "next";
import Link from "next/link";
import { currentUser, signOut } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { Avatar } from "@/components/Avatar";
import { CartProvider } from "@/components/CartProvider";
import { CartLink } from "@/components/CartLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShopWithVee",
  description: "Beautiful Nigerian-made goods, delivered across Lagos.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  return (
    <html lang="en-NG">
      <body>
        <CartProvider signedIn={Boolean(user)}>
          <header className="site-header">
            <div className="container header-inner">
              <Link href="/" className="logo">Shop<span>WithVee</span></Link>
              <nav>
                <Link href="/">Shop</Link>
                {isAdminEmail(user?.email) && <Link href="/admin">Admin</Link>}
                <CartLink />
                {user ? (
                  <>
                    <Link href="/profile" className="profile-link" title={user.email}>
                      <Avatar name={user.name} email={user.email} image={user.image} size={30} />
                      <span className="hide-sm">{(user.name ?? user.email).split(" ")[0]}</span>
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/" });
                      }}
                    >
                      <button className="link-btn">Sign out</button>
                    </form>
                  </>
                ) : (
                  <Link href="/signin" className="btn small">Sign in</Link>
                )}
              </nav>
            </div>
          </header>
          <main className="container">{children}</main>
          <footer className="site-footer container">
            <span>© {new Date().getFullYear()} ShopWithVee · Delivering across Lagos Island &amp; Mainland</span>
            <span className="footer-links">
              <Link href="/privacy">Privacy policy</Link>
              <Link href="/terms">Terms &amp; returns</Link>
            </span>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
