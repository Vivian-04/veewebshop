import { createPasswordAccount } from "@/lib/accounts";
import { apiError, corsPreflight, createApiToken, json, publicUser, readJson } from "@/lib/api";
import { sql, type User } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

export const OPTIONS = corsPreflight;

/** App sign-up. Creates the same kind of account as the website, then signs the app in. */
export async function POST(req: Request) {
  const body = await readJson<{ name: string; email: string; password: string }>(req);
  const result = await createPasswordAccount(
    { name: String(body?.name ?? ""), email: String(body?.email ?? ""), password: String(body?.password ?? "") },
    clientIp(req.headers),
  );
  if ("error" in result) return apiError(result.error, 400);

  const [user] = await sql<User[]>`
    SELECT id, email, name, image, phone, address, zone, created_at FROM users WHERE id = ${result.userId}`;
  return json({ token: await createApiToken(user.id), user: publicUser(user) }, 201);
}
