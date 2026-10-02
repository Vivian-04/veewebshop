import { sql } from "./db";
import { hashPassword, verifyPassword } from "./password";
import {
  SIGNUP_LIMIT_MESSAGE,
  clearFailedSignIns,
  isSignInLocked,
  isSignUpLimited,
  recordFailedSignIn,
  recordSignUp,
} from "./rate-limit";

// Shared by the website's sign-in/sign-up forms and the mobile API, so both enforce the same rules.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignUpInput = { name: string; email: string; password: string; confirm?: string };

export function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

/** Returns an error message, or null if the sign-up details are valid. */
export function validateSignUp({ name, email, password, confirm }: SignUpInput) {
  if (!name) return "Please enter your name.";
  if (!EMAIL_RE.test(email)) return "Please enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (confirm !== undefined && password !== confirm) return "Passwords don't match.";
  return null;
}

export type SignUpResult = { userId: number } | { error: string };

export async function createPasswordAccount(input: SignUpInput, ip: string): Promise<SignUpResult> {
  const name = input.name.trim().slice(0, 100);
  const email = normalizeEmail(input.email);
  const invalid = validateSignUp({ ...input, name, email });
  if (invalid) return { error: invalid };
  if (await isSignUpLimited(ip)) return { error: SIGNUP_LIMIT_MESSAGE };

  const passwordHash = await hashPassword(input.password);
  // Never attach a password to an existing account (e.g. a Google one): we can't prove this person owns the email.
  const [created] = await sql<{ id: number }[]>`
    INSERT INTO users (email, name, password_hash) VALUES (${email}, ${name}, ${passwordHash})
    ON CONFLICT (email) DO NOTHING
    RETURNING id`;
  if (!created) return { error: "An account with this email already exists. Try signing in." };
  await recordSignUp(email, ip);
  return { userId: created.id };
}

export type PasswordCheck =
  | { ok: true; user: { id: number; email: string; name: string | null } }
  | { ok: false; locked: boolean };

/** Checks an email/password pair, applying the failed-attempt limits. */
export async function checkPassword(emailInput: string, password: string, ip: string): Promise<PasswordCheck> {
  const email = normalizeEmail(emailInput);
  if (!email || !password) return { ok: false, locked: false };
  if (await isSignInLocked(email, ip)) return { ok: false, locked: true };

  const [user] = await sql<{ id: number; email: string; name: string | null; password_hash: string | null }[]>`
    SELECT id, email, name, password_hash FROM users WHERE email = ${email}`;
  // Accounts created with Google have no password.
  if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) {
    await recordFailedSignIn(email, ip);
    return { ok: false, locked: await isSignInLocked(email, ip) };
  }

  await clearFailedSignIns(email);
  return { ok: true, user: { id: user.id, email: user.email, name: user.name } };
}
