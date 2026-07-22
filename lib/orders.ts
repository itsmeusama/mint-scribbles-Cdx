export const ORDER_STATUSES = ["new", "confirmed", "ready", "collected", "cancelled"] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  ready: "Ready for collection",
  collected: "Collected",
  cancelled: "Cancelled",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus);
}
