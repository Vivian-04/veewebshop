"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { safeCallbackUrl, signIn } from "@/auth";
import { createPasswordAccount, normalizeEmail } from "@/lib/accounts";
import { SIGNIN_LOCKED_MESSAGE, clientIp, isSignInLocked } from "@/lib/rate-limit";

export type AuthFormState = { error?: string; email?: string; name?: string };

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
  const input = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  };
  const keep = { name: input.name.trim().slice(0, 100), email: normalizeEmail(input.email) };

  const result = await createPasswordAccount(input, clientIp(await headers()));
  if ("error" in result) return { ...keep, error: result.error };

  return passwordSignIn(keep.email, input.password, safeCallbackUrl(formData.get("callbackUrl")));
}

export async function googleSignInAction(formData: FormData) {
  await signIn("google", { redirectTo: safeCallbackUrl(formData.get("callbackUrl")) });
}
