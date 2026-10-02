"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { safeCallbackUrl, signIn } from "@/auth";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  SIGNIN_LOCKED_MESSAGE,
  SIGNUP_LIMIT_MESSAGE,
  clientIp,
  isSignInLocked,
  isSignUpLimited,
  recordSignUp,
} from "@/lib/rate-limit";

export type AuthFormState = { error?: string; email?: string; name?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function passwordSignIn(email: string, password: string, callbackUrl: string): Promise<AuthFormState> {
  try {
    // On success this throws a redirect, which must propagate.
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      // authorize() records the failure; say so plainly if that attempt triggered the lock.
      const locked = await isSignInLocked(email, clientIp(await headers()));
      return { error: locked ? SIGNIN_LOCKED_MESSAGE : "Incorrect email or password.", email };
    }
    throw err;
  }
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };
  if (await isSignInLocked(email, clientIp(await headers()))) return { error: SIGNIN_LOCKED_MESSAGE, email };
  return passwordSignIn(email, password, safeCallbackUrl(formData.get("callbackUrl")));
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const keep = { name, email };

  if (!name) return { ...keep, error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { ...keep, error: "Please enter a valid email address." };
  if (password.length < 8) return { ...keep, error: "Password must be at least 8 characters." };
  if (password !== confirm) return { ...keep, error: "Passwords don't match." };

  const ip = clientIp(await headers());
  if (await isSignUpLimited(ip)) return { ...keep, error: SIGNUP_LIMIT_MESSAGE };

  const passwordHash = await hashPassword(password);
  // Never attach a password to an existing account (e.g. a Google one): we can't prove this person owns the email.
  const [created] = await sql<{ id: number }[]>`
    INSERT INTO users (email, name, password_hash) VALUES (${email}, ${name}, ${passwordHash})
    ON CONFLICT (email) DO NOTHING
    RETURNING id`;
  if (!created) return { ...keep, error: "An account with this email already exists. Try signing in." };
  await recordSignUp(email, ip);

  return passwordSignIn(email, password, safeCallbackUrl(formData.get("callbackUrl")));
}

export async function googleSignInAction(formData: FormData) {
  await signIn("google", { redirectTo: safeCallbackUrl(formData.get("callbackUrl")) });
}
