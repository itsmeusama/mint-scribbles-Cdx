export const ORDER_STATUSES = ["new", "confirmed", "ready", "collected", "cancelled"] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  ready: "Ready for collection",
  collected: "Collected",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_CUSTOMER_MESSAGES: Record<OrderStatus, string> = {
  new: "We received your order request and will review availability.",
  confirmed: "Your order is confirmed and is being prepared.",
  ready: "Your order is ready for collection.",
  collected: "Your order has been collected. Thank you for choosing Mint Scribbles.",
  cancelled: "This order has been cancelled. Contact us if you need any help.",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus);
}
