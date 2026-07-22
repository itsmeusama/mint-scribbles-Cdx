import Link from "next/link";

export default function AdminOverviewPage() {
  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Owner dashboard</p>
          <h1>Welcome to Mint Scribbles Admin.</h1>
          <p>
            Customer order requests are now saved securely and arrive in your
            order inbox automatically.
          </p>
        </div>
        <span className="admin-status-pill">Phase 2 active</span>
      </div>

      <section className="admin-summary-grid" aria-label="Admin sections">
        <article className="admin-summary-card">
          <div className="admin-card-topline">
            <span className="admin-card-number">01</span>
            <span className="admin-coming-label active">Active</span>
          </div>
          <h2>Orders</h2>
          <p>
            Review new customer requests, contact details, collection choices,
            payment preferences and order items in one place.
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
          <p className="admin-kicker">Phase 2 foundation</p>
          <h2>What is active now</h2>
        </div>
        <ul>
          <li><span>✓</span> Owner sign-in through ChatGPT</li>
          <li><span>✓</span> Database-backed order capture</li>
          <li><span>✓</span> Server-verified products and prices</li>
          <li><span>✓</span> Private owner order inbox</li>
        </ul>
      </section>
    </main>
  );
}
