const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

/** Formats an amount in kobo as naira, e.g. 1850000 -> "₦18,500". */
export function formatPrice(kobo: number) {
  return naira.format(kobo / 100);
}

const dateTime = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });
const dateOnly = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" });

export function formatDateTime(d: Date) {
  return dateTime.format(d);
}

export function formatDate(d: Date) {
  return dateOnly.format(d);
}
