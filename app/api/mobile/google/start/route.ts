import { googleEnabled, signIn } from "@/auth";
import { apiError } from "@/lib/api";
import { isAllowedAppRedirect, isValidChallenge } from "@/lib/mobile-oauth";

/** Step 1 of app Google sign-in (see lib/mobile-oauth.ts): hand off to the website's Google login. */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const redirect = params.get("redirect");
  const challenge = params.get("challenge");
  if (!googleEnabled) return apiError("Google sign-in isn't set up.", 404);
  if (!isAllowedAppRedirect(redirect) || !isValidChallenge(challenge)) return apiError("Invalid sign-in request.", 400);

  const finish = `/api/mobile/google/finish?${new URLSearchParams({ redirect, challenge })}`;
  // Throws a redirect to Google; Auth.js brings the browser back to `finish` afterwards.
  await signIn("google", { redirectTo: finish });
}
