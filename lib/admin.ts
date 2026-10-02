import { notFound } from "next/navigation";
import { currentUser } from "@/auth";

/** Shop admins, from ADMIN_EMAILS (comma-separated) in the environment. */
export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  return !!email && adminEmails().includes(email.toLowerCase());
}

/** For admin pages and actions: returns the admin user, or shows a 404 so the area isn't advertised. */
export async function requireAdmin() {
  const user = await currentUser();
  if (!user || !isAdminEmail(user.email)) notFound();
  return user;
}
