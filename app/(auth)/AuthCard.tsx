import { redirect } from "next/navigation";
import { currentUser, googleEnabled, safeCallbackUrl } from "@/auth";
import { googleSignInAction } from "./actions";
import { AuthForm } from "./AuthForm";

export async function AuthCard({
  mode,
  searchParams,
}: {
  mode: "signin" | "signup";
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl ?? "/");
  // Check for a real account, not just a session cookie: a stale session for a deleted user
  // would otherwise bounce between here and pages that require an account.
  if (await currentUser()) redirect(callbackUrl);

  return (
    <div className="auth-card panel">
      <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className="muted">
        {mode === "signin" ? "Sign in to check out and track your orders." : "Shop faster and keep track of your orders."}
      </p>
      {googleEnabled && (
        <>
          <form action={googleSignInAction}>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <button className="btn block">Continue with Google</button>
          </form>
          <div className="divider"><span>or</span></div>
        </>
      )}
      <AuthForm mode={mode} callbackUrl={callbackUrl} />
    </div>
  );
}
