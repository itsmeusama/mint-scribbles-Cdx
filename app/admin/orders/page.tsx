export default function AdminOrdersPage() {
  return (
    <main className="admin-content">
      <div className="admin-page-heading compact">
        <div>
          <p className="admin-kicker">Orders</p>
          <h1>Customer orders</h1>
          <p>Order management will be connected during Phases 2 and 3.</p>
        </div>
      </div>

      <section className="admin-empty-state">
        <span className="admin-empty-icon" aria-hidden="true">□</span>
        <p className="admin-kicker">Nothing to manage yet</p>
        <h2>Orders will appear here automatically.</h2>
        <p>
          After the database-backed checkout is added, this page will show every
          order request, payment choice and collection preference in one place.
        </p>
        <div className="admin-preview-row" aria-label="Future order fields">
          <span>Order reference</span>
          <span>Customer</span>
          <span>Total</span>
          <span>Status</span>
        </div>
      </section>
    </main>
  );
}
