// Order lifecycle. Payment is collected on delivery, so "delivered" also means paid.
export const ORDER_STATUSES = {
  pending: { label: "New", next: ["confirmed", "cancelled"] },
  confirmed: { label: "Confirmed", next: ["dispatched", "cancelled"] },
  dispatched: { label: "Out for delivery", next: ["delivered", "cancelled"] },
  delivered: { label: "Delivered", next: [] },
  cancelled: { label: "Cancelled", next: [] },
} as const satisfies Record<string, { label: string; next: readonly string[] }>;

export type OrderStatus = keyof typeof ORDER_STATUSES;

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && value in ORDER_STATUSES;
}

export function statusLabel(status: string) {
  return isOrderStatus(status) ? ORDER_STATUSES[status].label : status;
}

export function canMoveTo(from: string, to: OrderStatus) {
  return isOrderStatus(from) && (ORDER_STATUSES[from].next as readonly string[]).includes(to);
}
