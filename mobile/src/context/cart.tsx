import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { api, type Cart, type CartLine, type Product } from "@/lib/api";
import { CART_SYNC_INTERVAL_MS } from "@/lib/config";
import { useAuth } from "./auth";

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotalKobo: number;
  /** The last error from a cart change (e.g. sold out), cleared on the next change. */
  error: string | null;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Signed out: a temporary cart kept on the phone, merged into the account on sign-in.
 * Signed in: the account's cart from the website's /api/cart, kept in sync by polling
 * /api/cart/version every couple of seconds while the app is open.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const signedIn = Boolean(user);
  const [items, setItems] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(-1);
  const pending = useRef(0);
  const guestItems = useRef<CartLine[]>([]);

  const applyServer = useCallback((cart: Cart) => {
    version.current = cart.version;
    setItems(cart.items);
  }, []);

  const refresh = useCallback(async () => {
    if (!signedIn) return;
    try {
      applyServer(await api<Cart>("/api/cart"));
    } catch {}
  }, [signedIn, applyServer]);

  // Keep a copy of the guest cart so it can be merged when the user signs in.
  useEffect(() => {
    if (!signedIn) guestItems.current = items;
  }, [signedIn, items]);

  // On sign-in, merge the guest cart into the account; on sign-out, start empty.
  useEffect(() => {
    if (!signedIn) {
      version.current = -1;
      setItems([]);
      return;
    }
    const guest = guestItems.current;
    guestItems.current = [];
    const load =
      guest.length > 0
        ? api<Cart>("/api/cart/merge", {
            method: "POST",
            body: { items: guest.map((i) => ({ productId: i.productId, quantity: i.quantity })) },
          })
        : api<Cart>("/api/cart");
    load.then(applyServer, () => {});
  }, [signedIn, user?.id, applyServer]);

  // Near-instant sync with the website while the app is in the foreground.
  useEffect(() => {
    if (!signedIn) return;
    let active = AppState.currentState === "active";
    async function check() {
      if (!active || pending.current > 0) return;
      try {
        const { version: latest } = await api<{ version: number }>("/api/cart/version");
        if (latest !== version.current && pending.current === 0) applyServer(await api<Cart>("/api/cart"));
      } catch {}
    }
    const timer = setInterval(check, CART_SYNC_INTERVAL_MS);
    const sub = AppState.addEventListener("change", (state) => {
      active = state === "active";
      if (active) void check(); // coming back to the app: catch up straight away
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [signedIn, applyServer]);

  /** Update the screen straight away, then confirm with the server (or fall back to the server's copy). */
  const mutate = useCallback(
    (optimistic: (prev: CartLine[]) => CartLine[], request: () => Promise<Cart>) => {
      setError(null);
      setItems(optimistic);
      if (!signedIn) return;
      pending.current++;
      request()
        .then(applyServer, async (err: Error) => {
          setError(err.message);
          try {
            applyServer(await api<Cart>("/api/cart"));
          } catch {}
        })
        .finally(() => pending.current--);
    },
    [signedIn, applyServer],
  );

  const add = useCallback(
    (product: Product, quantity = 1) =>
      mutate(
        (prev) =>
          prev.some((i) => i.productId === product.id)
            ? prev.map((i) =>
                i.productId === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock, 99) } : i,
              )
            : [
                ...prev,
                {
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  priceKobo: product.priceKobo,
                  imageUrl: product.imageUrl,
                  stock: product.stock,
                  quantity: Math.min(quantity, product.stock),
                },
              ],
        () => api<Cart>("/api/cart", { method: "POST", body: { productId: product.id, quantity } }),
      ),
    [mutate],
  );

  const setQuantity = useCallback(
    (productId: number, quantity: number) =>
      mutate(
        (prev) =>
          quantity <= 0
            ? prev.filter((i) => i.productId !== productId)
            : prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stock, 99) } : i)),
        () => api<Cart>("/api/cart", { method: "PATCH", body: { productId, quantity: Math.max(0, quantity) } }),
      ),
    [mutate],
  );

  const remove = useCallback(
    (productId: number) =>
      mutate(
        (prev) => prev.filter((i) => i.productId !== productId),
        () => api<Cart>(`/api/cart?productId=${productId}`, { method: "DELETE" }),
      ),
    [mutate],
  );

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotalKobo: items.reduce((n, i) => n + i.quantity * i.priceKobo, 0),
      error,
      add,
      setQuantity,
      remove,
      refresh,
    }),
    [items, error, add, setQuantity, remove, refresh],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
