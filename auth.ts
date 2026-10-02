import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { checkPassword } from "@/lib/accounts";
import { sql, type User } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

// On Netlify, requests arrive with an internal per-deploy hostname, which would make Google redirect
// to the wrong address. Use the site's main URL (Netlify sets URL and CONTEXT) unless AUTH_URL is set.
if (!process.env.AUTH_URL && process.env.CONTEXT === "production" && process.env.URL) {
  process.env.AUTH_URL = process.env.URL;
}

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

const providers: Provider[] = [
  Credentials({
    id: "credentials",
    name: "Email and password",
    credentials: { email: { type: "email" }, password: { type: "password" } },
    async authorize(credentials, request) {
      // Limits are enforced here too (not just in the sign-in form) because this endpoint can be called directly.
      const result = await checkPassword(String(credentials?.email ?? ""), String(credentials?.password ?? ""), clientIp(request.headers));
      if (!result.ok) return null;
      return { id: String(result.user.id), email: result.user.email, name: result.user.name };
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
