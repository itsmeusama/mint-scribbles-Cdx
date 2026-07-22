import { getD1 } from "../../../../db";
import { isOrderStatus, ORDER_STATUS_CUSTOMER_MESSAGES, ORDER_STATUS_LABELS } from "../../../../lib/orders";
import { productImageUrl } from "../../../../lib/catalog";

type TrackingRequest = {
  reference?: unknown;
  email?: unknown;
};

type OrderRow = {
  id: string;
  reference: string;
  customer_name: string;
  collection_day: string;
  payment_method: string;
  subtotal_lkr: number;
  status: string;
  created_at: string;
  status_updated_at: string;
};

type OrderItemRow = {
  id: number;
  product_name: string;
  unit_price_lkr: number;
  quantity: number;
  line_total_lkr: number;
  product_image_key: string;
  product_image_alt: string;
};

type HistoryRow = {
  id: number;
  status: string;
  created_at: string;
};

function cleanText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as TrackingRequest;
    const reference = cleanText(payload.reference, 40).toUpperCase();
    const email = cleanText(payload.email, 254).toLowerCase();

    if (!/^MS-\d{6}-[A-Z0-9]{6}$/.test(reference) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter your order reference and order email." }, { status: 400 });
    }

    const d1 = getD1();
    const order = await d1.prepare(`
      SELECT id, reference, customer_name, collection_day, payment_method,
             subtotal_pence AS subtotal_lkr, status, created_at, status_updated_at
      FROM orders
      WHERE reference = ? AND lower(email) = ?
    `).bind(reference, email).first<OrderRow>();

    if (!order) {
      return Response.json(
        { error: "We could not find an order matching those details." },
        { status: 404 },
      );
    }

    const [itemsResult, historyResult] = await Promise.all([
      d1.prepare(`
        SELECT id, product_name, unit_price_pence AS unit_price_lkr, quantity,
               line_total_pence AS line_total_lkr, product_image_key, product_image_alt
        FROM order_items
        WHERE order_id = ?
        ORDER BY id
      `).bind(order.id).all<OrderItemRow>(),
      d1.prepare(`
        SELECT id, status, created_at
        FROM order_status_history
        WHERE order_id = ?
        ORDER BY created_at DESC, id DESC
      `).bind(order.id).all<HistoryRow>(),
    ]);

    const status = isOrderStatus(order.status) ? order.status : "new";
    const history = historyResult.results
      .filter((entry) => isOrderStatus(entry.status))
      .map((entry) => {
        const entryStatus = entry.status as keyof typeof ORDER_STATUS_LABELS;
        return {
          id: entry.id,
          status: entryStatus,
          label: ORDER_STATUS_LABELS[entryStatus],
          message: ORDER_STATUS_CUSTOMER_MESSAGES[entryStatus],
          createdAt: entry.created_at,
        };
      });

    return Response.json({
      order: {
        reference: order.reference,
        customerName: order.customer_name,
        collectionDay: order.collection_day,
        paymentMethod: order.payment_method,
        subtotalLkr: order.subtotal_lkr,
        status,
        statusLabel: ORDER_STATUS_LABELS[status],
        statusMessage: ORDER_STATUS_CUSTOMER_MESSAGES[status],
        createdAt: order.created_at,
        statusUpdatedAt: order.status_updated_at,
        items: itemsResult.results.map((item) => ({
          id: item.id,
          productName: item.product_name,
          unitPriceLkr: item.unit_price_lkr,
          quantity: item.quantity,
          lineTotalLkr: item.line_total_lkr,
          imageUrl: productImageUrl(item.product_image_key),
          imageAlt: item.product_image_alt,
        })),
        history,
      },
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Order tracking is temporarily unavailable. Please try again." },
      { status: 500 },
    );
  }
}
