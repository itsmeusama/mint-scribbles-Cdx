/* eslint-disable @next/next/no-img-element -- R2 images are served by the app's immutable image endpoint. */
import Link from "next/link";
import { and, desc, eq, inArray, like, or, type SQL } from "drizzle-orm";
import { getDb } from "../../../db";
import { orderItems, orders as ordersTable } from "../../../db/schema";
import { isOrderStatus, ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "../../../lib/orders";
import { productImageUrl } from "../../../lib/catalog";
import { formatLkr } from "../../../lib/money";
import { getMintAdminAccess } from "../../admin-access";
import OrderActions from "./OrderActions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string | string[]; status?: string | string[] }>;
};

function queryValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value ?? "").trim().slice(0, 100);
}

function formatDateTime(value: string) {
  const parsed = new Date(`${value.replace(" ", "T")}Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo",
  }).format(parsed);
}

async function loadOrders(search: string, status: OrderStatus | "") {
  const db = getDb();
  const conditions: SQL[] = [];

  if (status) conditions.push(eq(ordersTable.status, status));
  if (search) {
    const term = `%${search}%`;
    const matchesSearch = or(
      like(ordersTable.reference, term),
      like(ordersTable.customerName, term),
      like(ordersTable.email, term),
      like(ordersTable.phone, term),
    );
    if (matchesSearch) conditions.push(matchesSearch);
  }

  const orderRows = await db
    .select()
    .from(ordersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ordersTable.createdAt))
    .limit(100);

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

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { isOwner } = await getMintAdminAccess("/admin/orders");
  if (!isOwner) return null;

  const params = await searchParams;
  const search = queryValue(params.q);
  const requestedStatus = queryValue(params.status);
  const status = isOrderStatus(requestedStatus) ? requestedStatus : "";
  const result = await loadOrders(search, status).catch(() => null);

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
  const hasFilters = Boolean(search || status);

  return (
    <main className="admin-content">
      <div className="admin-page-heading compact">
        <div>
          <p className="admin-kicker">Orders</p>
          <h1>Manage customer orders</h1>
          <p>Search requests, update fulfilment status and keep private preparation notes.</p>
        </div>
        <span className="admin-status-pill">{orderRows.length} {orderRows.length === 1 ? "order" : "orders"}</span>
      </div>

      <form className="admin-order-filters" method="get">
        <label>
          <span>Search orders</span>
          <input name="q" type="search" defaultValue={search} placeholder="Reference, customer, email or phone" />
        </label>
        <label>
          <span>Order status</span>
          <select name="status" defaultValue={status}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((option) => <option key={option} value={option}>{ORDER_STATUS_LABELS[option]}</option>)}
          </select>
        </label>
        <button type="submit">Apply filters</button>
        {hasFilters && <Link href="/admin/orders">Clear</Link>}
      </form>

      {orderRows.length === 0 ? (
        <section className="admin-empty-state">
          <span className="admin-empty-icon" aria-hidden="true">□</span>
          <p className="admin-kicker">{hasFilters ? "No matches" : "Order inbox ready"}</p>
          <h2>{hasFilters ? "No orders match these filters." : "Your first customer order will appear here."}</h2>
          <p>{hasFilters ? "Try another customer name, reference or status." : "Checkout is connected and ready to receive customer requests."}</p>
          {hasFilters && <Link className="admin-primary-action" href="/admin/orders">View all orders</Link>}
        </section>
      ) : (
        <section className="admin-order-list" aria-label="Customer orders">
          {orderRows.map((order) => {
            const orderStatus = isOrderStatus(order.status) ? order.status : "new";
            return (
              <article className="admin-order-card" key={order.id}>
                <header className="admin-order-card-header">
                  <div>
                    <small>Order reference</small>
                    <h2>{order.reference}</h2>
                    <p>Status updated {formatDateTime(order.statusUpdatedAt)}</p>
                  </div>
                  <span className={`admin-order-status status-${orderStatus}`}>{ORDER_STATUS_LABELS[orderStatus]}</span>
                </header>

                <div className="admin-order-details">
                  <div><small>Customer</small><strong>{order.customerName}</strong><a href={`mailto:${order.email}`}>{order.email}</a><a href={`tel:${order.phone}`}>{order.phone}</a></div>
                  <div><small>Collection</small><strong>{order.collectionDay}</strong><span>{order.paymentMethod === "deposit" ? "Bank deposit" : "Pay at collection"}</span></div>
                  <div><small>Received</small><strong>{formatDateTime(order.createdAt)}</strong><span>Updated {formatDateTime(order.updatedAt)}</span></div>
                  <div><small>Total</small><strong>{formatLkr(order.subtotalLkr)}</strong><span>{(itemsByOrder.get(order.id) ?? []).reduce((sum, item) => sum + item.quantity, 0)} items</span></div>
                </div>

                <div className="admin-order-items">
                  {(itemsByOrder.get(order.id) ?? []).map((item) => {
                    return (
                      <div className="admin-order-item" key={item.id}>
                        <div className="admin-order-product-thumb" aria-hidden="true">
                          {item.productImageKey ? (
                            <img src={productImageUrl(item.productImageKey)} alt="" />
                          ) : (
                            <div className={`product-art ${item.productVisual || "unknown"}`}>
                              <span className="object-one" /><span className="object-two" /><span className="object-three" />
                            </div>
                          )}
                        </div>
                        <div className="admin-order-item-copy">
                          <strong>{item.quantity} × {item.productName}</strong>
                          <span>Product · {formatLkr(item.unitPriceLkr)} each</span>
                        </div>
                        <strong className="admin-order-line-total">{formatLkr(item.lineTotalLkr)}</strong>
                      </div>
                    );
                  })}
                </div>

                {order.notes && <div className="admin-order-notes"><small>Customer notes</small><p>{order.notes}</p></div>}
                <OrderActions orderId={order.id} currentStatus={orderStatus} currentNotes={order.adminNotes} />
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
