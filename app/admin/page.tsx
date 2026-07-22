import Link from "next/link";
import { count } from "drizzle-orm";
import { getDb } from "../../db";
import { orders } from "../../db/schema";
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

export default async function AdminOverviewPage() {
  const { isOwner } = await getMintAdminAccess("/admin");
  if (!isOwner) return null;
  const metrics = await loadOrderMetrics().catch(() => emptyMetrics);

  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Owner dashboard</p>
          <h1>Welcome to Mint Scribbles Admin.</h1>
          <p>Track every customer request from arrival through collection.</p>
        </div>
        <span className="admin-status-pill">Phase 3 active</span>
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
            <span className="admin-coming-label">Future phase</span>
          </div>
          <h2>Products</h2>
          <p>The product catalogue will later be managed here without changing website code or republishing the shop.</p>
          <Link href="/admin/products">Open products</Link>
        </article>
      </section>

      <section className="admin-foundation-card">
        <div>
          <p className="admin-kicker">Phase 3 workflow</p>
          <h2>What is active now</h2>
        </div>
        <ul>
          <li><span>✓</span> Search and status filters</li>
          <li><span>✓</span> Fulfilment status updates</li>
          <li><span>✓</span> Private owner notes</li>
          <li><span>✓</span> Status timestamps and history</li>
        </ul>
      </section>
    </main>
  );
}
