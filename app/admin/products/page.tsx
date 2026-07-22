import { asc } from "drizzle-orm";
import { getDb } from "../../../db";
import { products as productsTable } from "../../../db/schema";
import { isProductCategory, isProductVisual, productImageUrl, type Product } from "../../../lib/catalog";
import { getMintAdminAccess } from "../../admin-access";
import ProductManager from "./ProductManager";

export const dynamic = "force-dynamic";

async function loadProducts() {
  const rows = await getDb().select().from(productsTable).orderBy(asc(productsTable.sortOrder), asc(productsTable.name));
  return rows.map((product): Product & { archived: boolean; sortOrder: number } => ({
    id: product.id,
    name: product.name,
    price: product.priceLkr,
    category: isProductCategory(product.category) ? product.category : "Individual",
    description: product.description,
    contents: product.contents,
    visual: isProductVisual(product.visual) ? product.visual : "notebook",
    badge: product.badge,
    imageUrl: productImageUrl(product.imageKey),
    imageAlt: product.imageAlt,
    available: product.available,
    archived: product.archived,
    sortOrder: product.sortOrder,
  }));
}

export default async function AdminProductsPage() {
  const { isOwner } = await getMintAdminAccess("/admin/products");
  if (!isOwner) return null;
  const products = await loadProducts().catch(() => null);

  return (
    <main className="admin-content">
      <div className="admin-page-heading compact">
        <div>
          <p className="admin-kicker">Products</p>
          <h1>Manage the catalogue</h1>
          <p>Add products, update prices and details, control availability, or archive items safely.</p>
        </div>
        <span className="admin-status-pill">Phase 4 active</span>
      </div>

      {products ? <ProductManager products={products} /> : (
        <section className="admin-empty-state">
          <span className="admin-empty-icon" aria-hidden="true">!</span>
          <h2>The catalogue manager is temporarily unavailable.</h2>
          <p>Please refresh in a moment. Existing shop products are unaffected.</p>
        </section>
      )}
    </main>
  );
}
