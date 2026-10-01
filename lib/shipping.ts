// Flat delivery fees within Lagos, in kobo. Change the amounts here.
export const SHIPPING_ZONES = {
  mainland: { label: "Lagos Mainland", feeKobo: 300000, examples: "Ikeja, Yaba, Surulere, Gbagada, Ikorodu…" },
  island: { label: "Lagos Island", feeKobo: 500000, examples: "Lekki, Victoria Island, Ikoyi, Ajah…" },
} as const;

export type ShippingZone = keyof typeof SHIPPING_ZONES;

export function isShippingZone(value: unknown): value is ShippingZone {
  return value === "mainland" || value === "island";
}

/** Normalises a Nigerian phone number to +234XXXXXXXXXX, or returns null if it isn't valid. */
export function normalizeNigerianPhone(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, "");
  const match = digits.match(/^(?:\+?234|0)([789][01]\d{8})$/);
  return match ? `+234${match[1]}` : null;
}
