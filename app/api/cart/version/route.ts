import { corsPreflight, json, withUser } from "@/lib/api";
import { getCartVersion } from "@/lib/cart";

export const OPTIONS = corsPreflight;

/** A tiny endpoint clients poll every few seconds; they refetch the cart only when the number changes. */
export function GET(req: Request) {
  return withUser(req, async (user) => json({ version: await getCartVersion(user.id) }));
}
