"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction, signUpAction, type AuthFormState } from "./actions";

export function AuthForm({ mode, callbackUrl }: { mode: "signin" | "signup"; callbackUrl: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    mode === "signin" ? signInAction : signUpAction,
    {},
  );
  const [showPassword, setShowPassword] = useState(false);
  const otherHref = `/${mode === "signin" ? "signup" : "signin"}?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <form action={action} className="fields">
      {state.error && <div className="alert error" role="alert">{state.error}</div>}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {mode === "signup" && (
        <label>
          Full name
          <input name="name" defaultValue={state.name} required autoComplete="name" />
        </label>
      )}
      <label>
        Email
        <input name="email" type="email" defaultValue={state.email} required autoComplete="email" />
      </label>
      <label>
        Password
        <div className="password-field">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          <button type="button" className="link-btn" onClick={() => setShowPassword((s) => !s)}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </label>
      {mode === "signup" && (
        <label>
          Confirm password
          <input name="confirm" type={showPassword ? "text" : "password"} required autoComplete="new-password" />
          <span className="muted small">At least 8 characters.</span>
        </label>
      )}
      <button className="btn primary block" disabled={pending}>
        {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>
      <p className="muted center">
        {mode === "signin" ? "New to ShopWithVee? " : "Already have an account? "}
        <Link href={otherHref} className="text-link">{mode === "signin" ? "Create an account" : "Sign in"}</Link>
      </p>
    </form>
  );
}
