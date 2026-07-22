import { desc, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { orderItems, orders as ordersTable } from "../../../db/schema";
import { findProduct } from "../../../lib/catalog";
import { getMintAdminAccess } from "../../admin-access";

export const dynamic = "force-dynamic";

const money = (pence: number) => `£${(pence / 100).toFixed(2)}`;

function formatReceivedAt(value: string) {
  const parsed = new Date(`${value.replace(" ", "T")}Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(parsed);
}

async function loadOrders() {
  const db = getDb();
  const orderRows = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(50);

  const itemRows = orderRows.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderRows.map((order) => order.id)))
    : [];
  const itemsByOrder = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const current = itemsByOrder.get(item.orderId) ?? [];
    current.push(item);
    itemsByOrder.set(item.orderId, current);
  }

  return { orderRows, itemsByOrder };
}

export default async function AdminOrdersPage() {
  const { isOwner } = await getMintAdminAccess("/admin/orders");
  if (!isOwner) return null;

  const result = await loadOrders().catch(() => null);
  if (!result) {
    return (
      <main className="admin-content">
        <div className="admin-page-heading compact">
          <div><p className="admin-kicker">Orders</p><h1>Customer orders</h1></div>
        </div>
        <section className="admin-empty-state">
          <span className="admin-empty-icon" aria-hidden="true">!</span>
          <h2>The order inbox is temporarily unavailable.</h2>
          <p>Please refresh in a moment. No customer action is required.</p>
        </section>
      </main>
    );
  }

  const { orderRows, itemsByOrder } = result;
  return (
    <main className="admin-content">
      <div className="admin-page-heading compact">
        <div>
          <p className="admin-kicker">Orders</p>
          <h1>Customer orders</h1>
          <p>New checkout requests appear here automatically.</p>
        </div>
        <span className="admin-status-pill">{orderRows.length} {orderRows.length === 1 ? "order" : "orders"}</span>
      </div>

      {orderRows.length === 0 ? (
        <section className="admin-empty-state">
          <span className="admin-empty-icon" aria-hidden="true">□</span>
          <p className="admin-kicker">Order inbox ready</p>
          <h2>Your first customer order will appear here.</h2>
          <p>
            Checkout is connected to the order database. Each request will
            include customer details, collection preference, payment choice
            and the products ordered.
          </p>
        </section>
      ) : (
        <section className="admin-order-list" aria-label="Customer orders">
          {orderRows.map((order) => (
            <article className="admin-order-card" key={order.id}>
              <header className="admin-order-card-header">
                <div>
                  <small>Order reference</small>
                  <h2>{order.reference}</h2>
                </div>
                <span className="admin-order-status">{order.status}</span>
              </header>

              <div className="admin-order-details">
                <div><small>Customer</small><strong>{order.customerName}</strong><a href={`mailto:${order.email}`}>{order.email}</a><a href={`tel:${order.phone}`}>{order.phone}</a></div>
                <div><small>Collection</small><strong>{order.collectionDay}</strong><span>{order.paymentMethod === "deposit" ? "Bank deposit" : "Pay at collection"}</span></div>
                <div><small>Received</small><strong>{formatReceivedAt(order.createdAt)}</strong><span>Awaiting confirmation</span></div>
                <div><small>Total</small><strong>{money(order.subtotalPence)}</strong><span>{(itemsByOrder.get(order.id) ?? []).reduce((sum, item) => sum + item.quantity, 0)} items</span></div>
              </div>

              <div className="admin-order-items">
                {(itemsByOrder.get(order.id) ?? []).map((item) => {
                  const product = findProduct(item.productId);
                  return (
                    <div className="admin-order-item" key={item.id}>
                      <div className="admin-order-product-thumb" aria-hidden="true">
                        <div className={`product-art ${product?.visual ?? "unknown"}`}>
                          <span className="object-one" />
                          <span className="object-two" />
                          <span className="object-three" />
                        </div>
                      </div>
                      <div className="admin-order-item-copy">
                        <strong>{item.quantity} × {item.productName}</strong>
                        <span>{product?.category ?? "Product"} · {money(item.unitPricePence)} each</span>
                      </div>
                      <strong className="admin-order-line-total">{money(item.lineTotalPence)}</strong>
                    </div>
                  );
                })}
              </div>

              {order.notes && <div className="admin-order-notes"><small>Customer notes</small><p>{order.notes}</p></div>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
