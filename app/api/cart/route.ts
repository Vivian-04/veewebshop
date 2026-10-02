import { apiError, corsPreflight, json, readJson, withUser } from "@/lib/api";
import { CartError, addToCart, clearCart, getCart, setCartQuantity, type Cart } from "@/lib/cart";

export const OPTIONS = corsPreflight;

// Every response is the full, current cart (including its version), so clients just replace their copy.

export function GET(req: Request) {
  return withUser(req, async (user) => json(await getCart(user.id)));
}

/** Add to cart: { productId, quantity? } (adds on top of what's already there). */
export function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson<{ productId: number; quantity: number }>(req);
    const quantity = body?.quantity === undefined ? 1 : Number(body.quantity);
    return cartResult(() => addToCart(user.id, Number(body?.productId), quantity));
  });
}

/** Set a quantity exactly: { productId, quantity } (0 removes the item). */
export function PATCH(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson<{ productId: number; quantity: number }>(req);
    return cartResult(() => setCartQuantity(user.id, Number(body?.productId), Number(body?.quantity)));
  });
}

/** Remove one item (`?productId=3`) or, with no productId, empty the cart. */
export function DELETE(req: Request) {
  return withUser(req, async (user) => {
    const productId = new URL(req.url).searchParams.get("productId");
    if (productId === null) {
      await clearCart(user.id);
      return json(await getCart(user.id));
    }
    return cartResult(() => setCartQuantity(user.id, Number(productId), 0));
  });
}

async function cartResult(change: () => Promise<Cart>) {
  try {
    return json(await change());
  } catch (err) {
    if (err instanceof CartError) return apiError(err.message, 400);
    throw err;
  }
}
