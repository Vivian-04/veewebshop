import type { Metadata } from "next";
import Link from "next/link";
import { auth, devLoginEnabled, googleEnabled, signIn, signOut } from "@/auth";
import { CartProvider } from "@/components/CartProvider";
import { CartLink } from "@/components/CartLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hearth & Co.",
  description: "Small-batch goods for the home",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <CartProvider>
          <header className="site-header">
            <div className="container header-inner">
              <Link href="/" className="logo">Hearth &amp; Co.</Link>
              <nav>
                <Link href="/">Shop</Link>
                {session?.user && <Link href="/orders">Orders</Link>}
                <CartLink />
                {session?.user ? (
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button className="link-btn" aria-label="Sign out" title={`Signed in as ${session.user.email ?? ""}`}>Sign out</button>
                  </form>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      // Straight to Google when it's the only option; otherwise show the provider picker.
                      await signIn(googleEnabled && !devLoginEnabled ? "google" : undefined);
                    }}
                  >
                    <button className="btn small">{googleEnabled && !devLoginEnabled ? "Sign in with Google" : "Sign in"}</button>
                  </form>
                )}
              </nav>
            </div>
          </header>
          <main className="container">{children}</main>
          <footer className="site-footer container">© {new Date().getFullYear()} Hearth &amp; Co.</footer>
        </CartProvider>
      </body>
    </html>
  );
}
