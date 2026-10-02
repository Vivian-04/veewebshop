import { sql } from "./db";

// Limits are per rolling window. Failed sign-ins are counted per email (protects one account)
// and per network address (stops one attacker trying many accounts).
const SIGNIN_WINDOW = "15 minutes";
const SIGNIN_MAX_PER_EMAIL = 5;
const SIGNIN_MAX_PER_IP = 20;
const SIGNUP_WINDOW = "1 hour";
const SIGNUP_MAX_PER_IP = 5;

export const SIGNIN_LOCKED_MESSAGE = "Too many failed sign-in attempts. Please wait 15 minutes and try again.";
export const SIGNUP_LIMIT_MESSAGE = "Too many accounts created from this network. Please try again in an hour.";

/** Best-effort client IP from proxy headers (Vercel and most hosts set x-forwarded-for). */
export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

export async function isSignInLocked(email: string, ip: string) {
  const [row] = await sql<{ by_email: number; by_ip: number }[]>`
    SELECT
      count(*) FILTER (WHERE email = ${email})::int AS by_email,
      count(*) FILTER (WHERE ip = ${ip})::int AS by_ip
    FROM auth_events
    WHERE kind = 'signin_failed' AND created_at > now() - ${SIGNIN_WINDOW}::interval
      AND (email = ${email} OR ip = ${ip})`;
  return row.by_email >= SIGNIN_MAX_PER_EMAIL || row.by_ip >= SIGNIN_MAX_PER_IP;
}

export async function recordFailedSignIn(email: string, ip: string) {
  await sql`INSERT INTO auth_events (kind, email, ip) VALUES ('signin_failed', ${email}, ${ip})`;
  // Keep the table small; old rows no longer affect any limit.
  await sql`DELETE FROM auth_events WHERE created_at < now() - interval '1 day'`;
}

export async function clearFailedSignIns(email: string) {
  await sql`DELETE FROM auth_events WHERE kind = 'signin_failed' AND email = ${email}`;
}

export async function isSignUpLimited(ip: string) {
  const [row] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM auth_events
    WHERE kind = 'signup' AND ip = ${ip} AND created_at > now() - ${SIGNUP_WINDOW}::interval`;
  return row.n >= SIGNUP_MAX_PER_IP;
}

export async function recordSignUp(email: string, ip: string) {
  await sql`INSERT INTO auth_events (kind, email, ip) VALUES ('signup', ${email}, ${ip})`;
}
