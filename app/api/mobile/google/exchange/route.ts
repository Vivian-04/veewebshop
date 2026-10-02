import { apiError, corsPreflight, createApiToken, json, publicUser, readJson } from "@/lib/api";
import { sql, type User } from "@/lib/db";
import { exchangeOAuthCode } from "@/lib/mobile-oauth";

export const OPTIONS = corsPreflight;

/** Step 3 of app Google sign-in: { code, verifier } in, the app's bearer token out. */
export async function POST(req: Request) {
  const body = await readJson<{ code: string; verifier: string }>(req);
  const code = String(body?.code ?? "");
  const verifier = String(body?.verifier ?? "");
  if (!code || !verifier) return apiError("Invalid sign-in request.", 400);

  const userId = await exchangeOAuthCode(code, verifier);
  if (!userId) return apiError("This sign-in link has expired. Please try again.", 400);

  const [user] = await sql<User[]>`
    SELECT id, email, name, image, phone, address, zone, created_at FROM users WHERE id = ${userId}`;
  return json({ token: await createApiToken(user.id), user: publicUser(user) });
}
