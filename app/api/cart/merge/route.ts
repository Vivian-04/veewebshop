import { apiError, corsPreflight, json, readJson, withUser } from "@/lib/api";
import { mergeIntoCart } from "@/lib/cart";

export const OPTIONS = corsPreflight;

/** Merge a signed-out cart into the account: { items: [{ productId, quantity }] }. */
export function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson<{ items: { productId: unknown; quantity: unknown }[] }>(req);
    if (!Array.isArray(body?.items)) return apiError("Expected a list of items.", 400);
    return json(await mergeIntoCart(user.id, body.items));
  });
}
