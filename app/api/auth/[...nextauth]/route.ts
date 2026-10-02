import { NextResponse, type NextRequest } from "next/server";
import { handlers, safeCallbackUrl } from "@/auth";

export const { POST } = handlers;

// Auth.js reports a cancelled Google sign-in (`?error=access_denied`) as a server "Configuration" error.
// Send the person back to where they came from instead: the sign-in page (keeping where they were headed),
// or, for a sign-in started by the mobile app, back to the app.
export function GET(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  if (pathname.startsWith("/api/auth/callback/") && searchParams.get("error") === "access_denied") {
    // On Netlify the request may arrive on an internal per-deploy hostname; use the public site URL.
    const origin = process.env.AUTH_URL ? new URL(process.env.AUTH_URL).origin : req.nextUrl.origin;
    const cookie =
      req.cookies.get("__Secure-authjs.callback-url")?.value ?? req.cookies.get("authjs.callback-url")?.value;
    let callbackUrl = "/";
    if (cookie) {
      try {
        const url = new URL(cookie, origin);
        // Only return to pages on this site.
        if (url.origin === origin) callbackUrl = safeCallbackUrl(url.pathname + url.search);
      } catch {}
    }
    if (callbackUrl.startsWith("/api/mobile/google/finish?")) {
      // The finish step validates the app redirect again and passes the error back to the app.
      return NextResponse.redirect(new URL(`${callbackUrl}&error=cancelled`, origin));
    }
    const signIn = new URL("/signin", origin);
    signIn.searchParams.set("callbackUrl", callbackUrl);
    signIn.searchParams.set("error", "cancelled");
    return NextResponse.redirect(signIn);
  }
  return handlers.GET(req);
}
