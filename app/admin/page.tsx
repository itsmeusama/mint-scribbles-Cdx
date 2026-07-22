import Link from "next/link";

export default function AdminOverviewPage() {
  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Owner dashboard</p>
          <h1>Welcome to Mint Scribbles Admin.</h1>
          <p>
            This private area will grow one small phase at a time. Secure owner
            access is now in place.
          </p>
        </div>
        <span className="admin-status-pill">Phase 1 complete</span>
      </div>

      <section className="admin-summary-grid" aria-label="Admin sections">
        <article className="admin-summary-card">
          <div className="admin-card-topline">
            <span className="admin-card-number">01</span>
            <span className="admin-coming-label">Next phase</span>
          </div>
          <h2>Orders</h2>
          <p>
            Customer order requests, collection details and payment choices will
            appear here after the order system is connected.
          </p>
          <Link href="/admin/orders">Open orders</Link>
        </article>

        <article className="admin-summary-card">
          <div className="admin-card-topline">
            <span className="admin-card-number">02</span>
            <span className="admin-coming-label">Future phase</span>
          </div>
          <h2>Products</h2>
          <p>
            The product catalogue will later be managed here without changing
            website code or republishing the shop.
          </p>
          <Link href="/admin/products">Open products</Link>
        </article>
      </section>

      <section className="admin-foundation-card">
        <div>
          <p className="admin-kicker">Phase 1 foundation</p>
          <h2>What is active now</h2>
        </div>
        <ul>
          <li><span>✓</span> Owner sign-in through ChatGPT</li>
          <li><span>✓</span> Server-side owner email verification</li>
          <li><span>✓</span> Protected admin pages</li>
          <li><span>✓</span> Secure sign-out</li>
        </ul>
      </section>
    </main>
  );
}
