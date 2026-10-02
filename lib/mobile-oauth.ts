import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { sql } from "./db";

// Google sign-in for the mobile app, reusing the website's Auth.js Google login:
//   1. The app opens /api/mobile/google/start?redirect=<app URL>&challenge=<sha256(verifier)> in a secure browser sheet.
//   2. The website signs the user in with Google, then /api/mobile/google/finish sends the browser back to the
//      app with a single-use code.
//   3. The app exchanges { code, verifier } at /api/mobile/google/exchange for its bearer token.
// The verifier never leaves the app until step 3, so an intercepted code is useless on its own.

const CODE_TTL = "5 minutes";
const EXPO_PROJECT_ID = "d66215d1-8a19-457c-b93d-755012635492";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

function isPrivateHost(host: string) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

/**
 * Only send codes back to the ShopWithVee app: its own `shopwithvee://` scheme, or Expo Go
 * running this project (from a dev server on the local network, or published via EAS Update).
 */
export function isAllowedAppRedirect(value: string | null): value is string {
  if (!value) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol === "shopwithvee:") return true;
  if (url.protocol !== "exp:") return false;
  if (isPrivateHost(url.hostname)) return true;
  return url.hostname === "u.expo.dev" && url.pathname.startsWith(`/${EXPO_PROJECT_ID}`);
}

export function isValidChallenge(value: string | null): value is string {
  return !!value && /^[a-f0-9]{64}$/.test(value);
}

/** Append query parameters to an app URL (works for exp:// URLs with or without a query). */
export function withParams(base: string, params: Record<string, string>) {
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

export async function createOAuthCode(userId: number, challenge: string) {
  const code = randomBytes(32).toString("base64url");
  await sql`DELETE FROM oauth_codes WHERE expires_at < now()`;
  await sql`
    INSERT INTO oauth_codes (code_hash, user_id, challenge, expires_at)
    VALUES (${sha256(code)}, ${userId}, ${challenge}, now() + ${CODE_TTL}::interval)`;
  return code;
}

/** Returns the user id if the code is valid, unexpired and matches the verifier. Codes work once. */
export async function exchangeOAuthCode(code: string, verifier: string) {
  const [row] = await sql<{ user_id: number; challenge: string }[]>`
    DELETE FROM oauth_codes WHERE code_hash = ${sha256(code)} AND expires_at > now()
    RETURNING user_id, challenge`;
  if (!row) return null;
  const expected = Buffer.from(row.challenge);
  const actual = Buffer.from(sha256(verifier));
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? row.user_id : null;
}
