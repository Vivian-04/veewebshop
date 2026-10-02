import { checkPassword } from "@/lib/accounts";
import { apiError, corsPreflight, createApiToken, json, publicUser, readJson } from "@/lib/api";
import { sql, type User } from "@/lib/db";
import { SIGNIN_LOCKED_MESSAGE, clientIp } from "@/lib/rate-limit";

export const OPTIONS = corsPreflight;

/** App sign-in: email + password in, a bearer token out. Same accounts and limits as the website. */
export async function POST(req: Request) {
  const body = await readJson<{ email: string; password: string }>(req);
  const email = String(body?.email ?? "");
  const password = String(body?.password ?? "");
  if (!email || !password) return apiError("Enter your email and password.", 400);

  const result = await checkPassword(email, password, clientIp(req.headers));
  if (!result.ok) {
    return result.locked ? apiError(SIGNIN_LOCKED_MESSAGE, 429) : apiError("Incorrect email or password.", 401);
  }

  const [user] = await sql<User[]>`
    SELECT id, email, name, image, phone, address, zone, created_at FROM users WHERE id = ${result.user.id}`;
  return json({ token: await createApiToken(user.id), user: publicUser(user) });
}
