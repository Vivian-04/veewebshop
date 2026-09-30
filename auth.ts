import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { sql } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
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
