import { getD1 } from "../../../db";
import { findProduct } from "../../../lib/catalog";

type OrderRequest = {
  customerName?: unknown;
  email?: unknown;
  phone?: unknown;
  collectionDay?: unknown;
  paymentMethod?: unknown;
  notes?: unknown;
  items?: unknown;
};

type RequestedItem = { productId?: unknown; quantity?: unknown };

const COLLECTION_DAYS = new Set(["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
const PAYMENT_METHODS = new Set(["collection", "deposit"]);

function cleanText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function createOrderReference() {
  const date = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `MS-${date}-${suffix}`;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as OrderRequest;
    const customerName = cleanText(payload.customerName, 100);
    const email = cleanText(payload.email, 254).toLowerCase();
    const phone = cleanText(payload.phone, 40);
    const collectionDay = cleanText(payload.collectionDay, 20);
    const paymentMethod = cleanText(payload.paymentMethod, 20);
    const notes = cleanText(payload.notes, 1000);

    if (customerName.length < 2) {
      return Response.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (phone.length < 5) {
      return Response.json({ error: "Please enter a valid phone number." }, { status: 400 });
    }
    if (!COLLECTION_DAYS.has(collectionDay)) {
      return Response.json({ error: "Please choose a valid collection day." }, { status: 400 });
    }
    if (!PAYMENT_METHODS.has(paymentMethod)) {
      return Response.json({ error: "Please choose a valid payment method." }, { status: 400 });
    }
    if (!Array.isArray(payload.items) || payload.items.length === 0 || payload.items.length > 50) {
      return Response.json({ error: "Your order must contain at least one item." }, { status: 400 });
    }

    const quantities = new Map<string, number>();
    for (const requested of payload.items as RequestedItem[]) {
      const productId = cleanText(requested.productId, 80);
      const quantity = typeof requested.quantity === "number" ? requested.quantity : Number.NaN;
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return Response.json({ error: "One of the order quantities is invalid." }, { status: 400 });
      }
      const combinedQuantity = (quantities.get(productId) ?? 0) + quantity;
      if (combinedQuantity > 20) {
        return Response.json({ error: "One of the order quantities is invalid." }, { status: 400 });
      }
      quantities.set(productId, combinedQuantity);
    }

    const items = Array.from(quantities, ([productId, quantity]) => {
      const product = findProduct(productId);
      if (!product || product.category === "Custom") return null;
      const unitPricePence = Math.round(product.price * 100);
      return {
        productId,
        productName: product.name,
        unitPricePence,
        quantity,
        lineTotalPence: unitPricePence * quantity,
      };
    });

    if (items.some((item) => item === null)) {
      return Response.json({ error: "One of the selected products is unavailable." }, { status: 400 });
    }

    const validItems = items.filter((item): item is NonNullable<typeof item> => item !== null);
    const subtotalPence = validItems.reduce((sum, item) => sum + item.lineTotalPence, 0);
    const id = crypto.randomUUID();
    const reference = createOrderReference();
    const d1 = getD1();

    await d1.batch([
      d1.prepare(`
        INSERT INTO orders (
          id, reference, customer_name, email, phone, collection_day,
          payment_method, notes, subtotal_pence, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
      `).bind(id, reference, customerName, email, phone, collectionDay, paymentMethod, notes, subtotalPence),
      ...validItems.map((item) => d1.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_name, unit_price_pence, quantity, line_total_pence
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, item.productId, item.productName, item.unitPricePence, item.quantity, item.lineTotalPence)),
    ]);

    return Response.json({ reference }, { status: 201 });
  } catch {
    return Response.json(
      { error: "We could not save your order just now. Please try again." },
      { status: 500 },
    );
  }
}
