import { corsPreflight, json, revokeApiToken } from "@/lib/api";

export const OPTIONS = corsPreflight;

/** Revokes the app's token so it can't be used again. */
export async function POST(req: Request) {
  await revokeApiToken(req);
  return json({ ok: true });
}
