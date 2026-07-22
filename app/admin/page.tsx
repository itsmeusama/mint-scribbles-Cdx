import Link from "next/link";
import { count } from "drizzle-orm";
import { getDb } from "../../db";
import { orders, products } from "../../db/schema";
import { getMintAdminAccess } from "../admin-access";

export const dynamic = "force-dynamic";

const emptyMetrics = { new: 0, confirmed: 0, ready: 0, collected: 0, cancelled: 0 };

async function loadOrderMetrics() {
  const rows = await getDb()
    .select({ status: orders.status, total: count() })
    .from(orders)
    .groupBy(orders.status);

  const metrics = { ...emptyMetrics };
  for (const row of rows) {
    if (row.status in metrics) metrics[row.status as keyof typeof metrics] = row.total;
  }
  return metrics;
}

async function loadProductMetrics() {
  const rows = await getDb().select({ available: products.available, archived: products.archived }).from(products);
  return {
    live: rows.filter((product) => !product.archived).length,
    soldOut: rows.filter((product) => !product.archived && !product.available).length,
    archived: rows.filter((product) => product.archived).length,
  };
}

export default async function AdminOverviewPage() {
  const { isOwner } = await getMintAdminAccess("/admin");
  if (!isOwner) return null;
  const [metrics, productMetrics] = await Promise.all([
    loadOrderMetrics().catch(() => emptyMetrics),
    loadProductMetrics().catch(() => ({ live: 0, soldOut: 0, archived: 0 })),
  ]);

  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Owner dashboard</p>
          <h1>Welcome to Mint Scribbles Admin.</h1>
          <p>Track every customer request from arrival through collection.</p>
        </div>
        <span className="admin-status-pill">Phase 4 active</span>
      </div>

      <section className="admin-metrics-grid" aria-label="Order status summary">
        <Link href="/admin/orders?status=new"><small>New</small><strong>{metrics.new}</strong></Link>
        <Link href="/admin/orders?status=confirmed"><small>Confirmed</small><strong>{metrics.confirmed}</strong></Link>
        <Link href="/admin/orders?status=ready"><small>Ready</small><strong>{metrics.ready}</strong></Link>
        <Link href="/admin/orders?status=collected"><small>Collected</small><strong>{metrics.collected}</strong></Link>
        <Link href="/admin/orders?status=cancelled"><small>Cancelled</small><strong>{metrics.cancelled}</strong></Link>
      </section>

      <section className="admin-summary-grid" aria-label="Admin sections">
        <article className="admin-summary-card">
          <div className="admin-card-topline">
            <span className="admin-card-number">01</span>
            <span className="admin-coming-label active">Manage</span>
          </div>
          <h2>Orders</h2>
          <p>Search requests, update their fulfilment status and keep private preparation notes.</p>
          <Link href="/admin/orders">Manage orders</Link>
        </article>

        <article className="admin-summary-card">
          <div className="admin-card-topline">
            <span className="admin-card-number">02</span>
            <span className="admin-coming-label active">Manage</span>
          </div>
          <h2>Products</h2>
          <p>{productMetrics.live} live products · {productMetrics.soldOut} sold out · {productMetrics.archived} archived. Changes appear in the storefront automatically.</p>
          <Link href="/admin/products">Manage products</Link>
        </article>
      </section>

      <section className="admin-foundation-card">
        <div>
          <p className="admin-kicker">Phase 4 customer updates</p>
          <h2>What is active now</h2>
        </div>
        <ul>
          <li><span>✓</span> Database-backed storefront catalogue</li>
          <li><span>✓</span> Add and edit product details</li>
          <li><span>✓</span> Sold-out availability controls</li>
          <li><span>✓</span> Safe archive and restore workflow</li>
          <li><span>✓</span> Private order tracking by reference and email</li>
          <li><span>✓</span> Customer-visible status timeline</li>
          <li><span>✓</span> LKR pricing and Sri Lanka collection details</li>
        </ul>
      </section>
    </main>
  );
}
