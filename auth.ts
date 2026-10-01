import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { sql, type User } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

const providers: Provider[] = [
  Credentials({
    id: "credentials",
    name: "Email and password",
    credentials: { email: { type: "email" }, password: { type: "password" } },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").trim().toLowerCase();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;

      const [user] = await sql<{ id: number; email: string; name: string | null; password_hash: string | null }[]>`
        SELECT id, email, name, password_hash FROM users WHERE email = ${email}`;
      // Accounts created with Google have no password.
      if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) return null;

      return { id: String(user.id), email: user.email, name: user.name };
    },
  }),
];
if (googleEnabled) providers.push(Google);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  // Errors go to our sign-in page (as ?error=...) instead of Auth.js's bare error screen.
  pages: { signIn: "/signin", error: "/signin" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      // Persist Google users in our own users table (password users are created at sign-up).
      if (account?.provider === "google") {
        // Google sign-in joins any existing account with the same email, so only trust emails Google has verified.
        if (profile?.email_verified !== true) return false;
        await sql`
          INSERT INTO users (email, name, image)
          VALUES (${user.email.toLowerCase()}, ${user.name ?? null}, ${user.image ?? null})
          ON CONFLICT (email) DO UPDATE SET image = EXCLUDED.image, name = COALESCE(users.name, EXCLUDED.name)`;
      }
      return true;
    },
  },
});

/** Returns the DB user row for the signed-in session, or null. */
export async function currentUser() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  const [user] = await sql<User[]>`
    SELECT id, email, name, image, phone, address, zone, created_at FROM users WHERE email = ${email}`;
  return user ?? null;
}

/** Only allow redirects to paths on this site. */
export function safeCallbackUrl(value: unknown) {
  const url = typeof value === "string" ? value : "";
  return url.startsWith("/") && !url.startsWith("//") ? url : "/";
}
