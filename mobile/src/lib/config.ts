// The shop's backend. Defaults to the live site; set EXPO_PUBLIC_API_URL (e.g. in mobile/.env.local)
// to point the app at a local server during development.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "https://shopwithvee.netlify.app").replace(/\/$/, "");

// How often the cart checks for changes made on the website while the app is open.
export const CART_SYNC_INTERVAL_MS = 2000;

export const SHIPPING_ZONES = {
  mainland: { label: "Lagos Mainland", feeKobo: 300000, examples: "Ikeja, Yaba, Surulere, Gbagada, Ikorodu…" },
  island: { label: "Lagos Island", feeKobo: 500000, examples: "Lekki, Victoria Island, Ikoyi, Ajah…" },
} as const;

export type ShippingZone = keyof typeof SHIPPING_ZONES;
