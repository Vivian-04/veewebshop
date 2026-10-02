"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  priceKobo: number;
  imageUrl: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalKobo: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  /** Re-read the cart (e.g. after checkout, which empties it on the server). */
  refresh: () => void;
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "shopwithvee-cart";
// How often a signed-in, visible page checks whether the cart changed elsewhere (e.g. in the mobile app).
const SYNC_INTERVAL_MS = 2000;

type ServerCart = { version: number; items: CartItem[] };

async function cartApi(method: string, path = "/api/cart", body?: unknown): Promise<ServerCart> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Cart request failed (${res.status})`);
  return res.json();
}

function readLocalCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Signed out: the cart lives in this browser (localStorage).
 * Signed in: the cart lives in the database via /api/cart, the same endpoints the mobile app uses,
 * and the page polls /api/cart/version so changes made on another device appear within seconds.
 */
export function CartProvider({ signedIn, children }: { signedIn: boolean; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const version = useRef(-1);
  // While a change is in flight, ignore sync results so they can't overwrite the optimistic update.
  const pending = useRef(0);

  const applyServer = useCallback((cart: ServerCart) => {
    version.current = cart.version;
    setItems(cart.items);
  }, []);

  const refresh = useCallback(() => {
    if (!signedIn) {
      setItems(readLocalCart());
      return;
    }
    cartApi("GET").then(applyServer, () => {});
  }, [signedIn, applyServer]);

  // Initial load. On sign-in, move anything from the browser cart into the account first.
  useEffect(() => {
    if (!signedIn) {
      setItems(readLocalCart());
      setReady(true);
      return;
    }
    const local = readLocalCart();
    const load =
      local.length > 0
        ? cartApi("POST", "/api/cart/merge", { items: local.map((i) => ({ productId: i.productId, quantity: i.quantity })) })
        : cartApi("GET");
    load
      .then((cart) => {
        if (local.length > 0) {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
        }
        applyServer(cart);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [signedIn, applyServer]);

  // Signed out: persist to localStorage.
  useEffect(() => {
    if (signedIn || !ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [signedIn, items, ready]);

  // Signed in: near-instant sync with other devices.
  useEffect(() => {
    if (!signedIn) return;
    let stopped = false;
    async function check() {
      if (stopped || document.visibilityState !== "visible" || pending.current > 0) return;
      try {
        const res = await fetch("/api/cart/version", { cache: "no-store" });
        if (!res.ok) return;
        const { version: latest } = await res.json();
        if (latest !== version.current && pending.current === 0) applyServer(await cartApi("GET"));
      } catch {}
    }
    const timer = setInterval(check, SYNC_INTERVAL_MS);
    const onVisible = () => void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [signedIn, applyServer]);

  /** Apply a change locally straight away, then confirm it with the server (or roll back to the server's copy). */
  const mutate = useCallback(
    (optimistic: (prev: CartItem[]) => CartItem[], request: () => Promise<ServerCart>) => {
      setItems(optimistic);
      if (!signedIn) return;
      pending.current++;
      request()
        .then(applyServer, () => cartApi("GET").then(applyServer, () => {}))
        .finally(() => pending.current--);
    },
    [signedIn, applyServer],
  );

  const add = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) =>
      mutate(
        (prev) =>
          prev.some((i) => i.productId === item.productId)
            ? prev.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i))
            : [...prev, { ...item, quantity }],
        () => cartApi("POST", "/api/cart", { productId: item.productId, quantity }),
      ),
    [mutate],
  );

  const setQuantity = useCallback(
    (productId: number, quantity: number) =>
      mutate(
        (prev) =>
          quantity <= 0
            ? prev.filter((i) => i.productId !== productId)
            : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        () => cartApi("PATCH", "/api/cart", { productId, quantity: Math.max(0, quantity) }),
      ),
    [mutate],
  );

  const remove = useCallback(
    (productId: number) =>
      mutate(
        (prev) => prev.filter((i) => i.productId !== productId),
        () => cartApi("DELETE", `/api/cart?productId=${productId}`),
      ),
    [mutate],
  );

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotalKobo: items.reduce((n, i) => n + i.quantity * i.priceKobo, 0),
      add,
      setQuantity,
      remove,
      refresh,
      ready,
    }),
    [items, add, setQuantity, remove, refresh, ready],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
