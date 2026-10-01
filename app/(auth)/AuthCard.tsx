import { redirect } from "next/navigation";
import { currentUser, googleEnabled, safeCallbackUrl } from "@/auth";
import { googleSignInAction } from "./actions";
import { AuthForm } from "./AuthForm";

// Messages for `?error=` codes: our own "cancelled", plus Auth.js error codes (pages.error points here).
const ERROR_MESSAGES: Record<string, { text: string; tone: "info" | "error" }> = {
  cancelled: { text: "Google sign-in was cancelled. You can try again or use your email and password.", tone: "info" },
  AccessDenied: { text: "That Google account couldn't be used to sign in. Make sure its email address is verified.", tone: "error" },
};
const FALLBACK_ERROR = { text: "Something went wrong while signing in. Please try again.", tone: "error" } as const;

export async function AuthCard({
  mode,
  searchParams,
}: {
  mode: "signin" | "signup";
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl ?? "/");
  const notice = params.error ? (ERROR_MESSAGES[params.error] ?? FALLBACK_ERROR) : null;
  // Check for a real account, not just a session cookie: a stale session for a deleted user
  // would otherwise bounce between here and pages that require an account.
  if (await currentUser()) redirect(callbackUrl);

  return (
    <div className="auth-card panel">
      <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className="muted">
        {mode === "signin" ? "Sign in to check out and track your orders." : "Shop faster and keep track of your orders."}
      </p>
      {notice && (
        <div className={`alert ${notice.tone === "info" ? "info" : "error"}`} role="status">{notice.text}</div>
      )}
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
