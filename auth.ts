import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { sql } from "@/lib/db";

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

// Local testing only: sign in with any email, no password. Never active in production builds.
export const devLoginEnabled = process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_LOGIN === "true";

const providers: Provider[] = [];
if (googleEnabled) providers.push(Google);
if (devLoginEnabled) {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Dev login (local only)",
      credentials: { email: { label: "Email", type: "email", placeholder: "test@example.com" } },
      authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
        return { id: email, email, name: email.split("@")[0] };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  callbacks: {
    // Persist every Google user in our own users table.
    async signIn({ user }) {
      if (!user.email) return false;
      await sql`
        INSERT INTO users (email, name, image)
        VALUES (${user.email}, ${user.name ?? null}, ${user.image ?? null})
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, image = EXCLUDED.image`;
      return true;
    },
  },
});

/** Returns the DB user row for the signed-in session, or null. */
export async function currentUser() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const [user] = await sql<{ id: number; email: string; name: string | null }[]>`
    SELECT id, email, name FROM users WHERE email = ${email}`;
  return user ?? null;
}
