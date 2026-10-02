/** Formats an amount in kobo as naira, e.g. 1850000 -> "₦18,500". */
export function formatPrice(kobo: number) {
  const naira = Math.round(kobo / 100);
  return "₦" + String(naira).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2 Oct 2026, 13:22" in Lagos time (UTC+1, no daylight saving). */
export function formatDateTime(iso: string) {
  const d = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "New",
  confirmed: "Confirmed",
  dispatched: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}
