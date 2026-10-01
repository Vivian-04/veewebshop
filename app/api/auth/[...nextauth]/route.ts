import { NextResponse, type NextRequest } from "next/server";
import { handlers, safeCallbackUrl } from "@/auth";

export const { POST } = handlers;

// Auth.js reports a cancelled Google sign-in (`?error=access_denied`) as a server "Configuration" error.
// Send the person back to the sign-in page they came from instead, keeping where they were headed.
export function GET(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  if (pathname.startsWith("/api/auth/callback/") && searchParams.get("error") === "access_denied") {
    const cookie =
      req.cookies.get("__Secure-authjs.callback-url")?.value ?? req.cookies.get("authjs.callback-url")?.value;
    let callbackUrl = "/";
    if (cookie) {
      try {
        const url = new URL(cookie, req.nextUrl.origin);
        // Only return to pages on this site.
        if (url.origin === req.nextUrl.origin) callbackUrl = safeCallbackUrl(url.pathname + url.search);
      } catch {}
    }
    const signIn = new URL("/signin", req.nextUrl.origin);
    signIn.searchParams.set("callbackUrl", callbackUrl);
    signIn.searchParams.set("error", "cancelled");
    return NextResponse.redirect(signIn);
  }
  return handlers.GET(req);
}
