import { API_URL, type ShippingZone } from "./config";

// Types mirror the JSON returned by the website's /api endpoints.

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceKobo: number;
  imageUrl: string | null;
  stock: number;
};

export type User = {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
  phone: string | null;
  address: string | null;
  zone: ShippingZone | null;
};

export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  priceKobo: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
};

export type Cart = { version: number; items: CartLine[]; count: number; subtotalKobo: number };

export type OrderSummary = {
  id: number;
  status: string;
  subtotalKobo: number;
  shippingKobo: number;
  totalKobo: number;
  zone: ShippingZone;
  shipping: { name: string; phone: string; address: string };
  itemCount?: number;
  createdAt: string;
};

export type Order = OrderSummary & { items: { productId: number; name: string; unitKobo: number; quantity: number }[] };

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

let authToken: string | null = null;

// Requests wait until the saved sign-in has been loaded on launch; otherwise a screen that loads
// immediately (e.g. reopening the app on an order) would be told "Please sign in".
let markTokenLoaded: () => void;
const tokenLoaded = new Promise<void>((resolve) => (markTokenLoaded = resolve));

/** Called by the auth context whenever the user signs in or out, and once the saved token is loaded. */
export function setAuthToken(token: string | null) {
  authToken = token;
  markTokenLoaded();
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  await tokenLoaded;
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("Couldn't reach the shop. Check your internet connection.", 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? `Something went wrong (${res.status}).`, res.status);
  return data as T;
}
