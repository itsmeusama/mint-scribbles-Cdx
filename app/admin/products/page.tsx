export default function AdminProductsPage() {
  return (
    <main className="admin-content">
      <div className="admin-page-heading compact">
        <div>
          <p className="admin-kicker">Products</p>
          <h1>Shop catalogue</h1>
          <p>Simple product management will be added in a later phase.</p>
        </div>
      </div>

      <section className="admin-empty-state">
        <span className="admin-empty-icon" aria-hidden="true">◇</span>
        <p className="admin-kicker">Coming in Phase 5</p>
        <h2>Products will be easy to manage here.</h2>
        <p>
          The owner will be able to add products, change prices, mark items sold
          out, and archive products using a simple form.
        </p>
        <div className="admin-preview-row products" aria-label="Future product actions">
          <span>Add product</span>
          <span>Edit details</span>
          <span>Availability</span>
          <span>Archive</span>
        </div>
      </section>
    </main>
  );
}
