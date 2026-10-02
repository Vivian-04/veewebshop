import { NextResponse } from "next/server";
import { currentUser } from "@/auth";
import { apiError } from "@/lib/api";
import { createOAuthCode, isAllowedAppRedirect, isValidChallenge, withParams } from "@/lib/mobile-oauth";

/** Step 2 of app Google sign-in: send the browser back to the app with a single-use code (or an error). */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const redirect = params.get("redirect");
  const challenge = params.get("challenge");
  if (!isAllowedAppRedirect(redirect) || !isValidChallenge(challenge)) return apiError("Invalid sign-in request.", 400);

  const user = params.get("error") ? null : await currentUser();
  if (!user) return NextResponse.redirect(withParams(redirect, { error: params.get("error") ?? "failed" }));

  return NextResponse.redirect(withParams(redirect, { code: await createOAuthCode(user.id, challenge) }));
}
