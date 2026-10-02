import { corsPreflight, json, publicUser, withUser } from "@/lib/api";

export const OPTIONS = corsPreflight;

/** The signed-in user, including saved delivery details (used to pre-fill checkout). */
export function GET(req: Request) {
  return withUser(req, async (user) => json({ user: publicUser(user) }));
}
