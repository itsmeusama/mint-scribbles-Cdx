"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_VISUALS,
  type Product,
  type ProductCategory,
  type ProductVisual,
} from "../../../lib/catalog";

type ManagedProduct = Product & { archived: boolean; sortOrder: number };

const emptyProduct: ManagedProduct = {
  id: "",
  name: "",
  price: 10,
  category: "Individual",
  description: "",
  contents: "",
  visual: "notebook",
  badge: "",
  available: true,
  archived: false,
  sortOrder: 0,
};

export default function ProductManager({ products }: { products: ManagedProduct[] }) {
  const [adding, setAdding] = useState(false);
  const active = products.filter((product) => !product.archived);
  const archived = products.filter((product) => product.archived);

  return (
    <div className="admin-product-manager">
      <div className="admin-product-toolbar">
        <div><strong>{active.length} live products</strong><span>{active.filter((product) => !product.available).length} currently sold out</span></div>
        <button type="button" onClick={() => setAdding((value) => !value)}>{adding ? "Close form" : "+ Add product"}</button>
      </div>

      {adding && (
        <section className="admin-new-product">
          <p className="admin-kicker">New catalogue item</p>
          <h2>Add a product</h2>
          <ProductEditor product={emptyProduct} isNew onSaved={() => setAdding(false)} />
        </section>
      )}

      <section className="admin-product-list" aria-label="Live products">
        {active.map((product) => <ProductEditor key={product.id} product={product} />)}
      </section>

      {archived.length > 0 && (
        <section className="admin-archived-products">
          <div><p className="admin-kicker">Hidden from the shop</p><h2>Archived products</h2></div>
          <div className="admin-product-list">
            {archived.map((product) => <ProductEditor key={product.id} product={product} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductEditor({ product, isNew = false, onSaved }: { product: ManagedProduct; isNew?: boolean; onSaved?: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toFixed(2));
  const [category, setCategory] = useState<ProductCategory>(product.category);
  const [description, setDescription] = useState(product.description);
  const [contents, setContents] = useState(product.contents ?? "");
  const [visual, setVisual] = useState<ProductVisual>(product.visual);
  const [badge, setBadge] = useState(product.badge ?? "");
  const [available, setAvailable] = useState(product.available);
  const [archived, setArchived] = useState(Boolean(product.archived));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function saveProduct(event?: FormEvent<HTMLFormElement>, archivedOverride?: boolean) {
    event?.preventDefault();
    if (saving) return;
    const nextArchived = archivedOverride ?? archived;
    if (archivedOverride === true && !window.confirm(`Archive ${name}? It will disappear from the shop but remain on past orders.`)) return;

    setSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          pricePence: Math.round(Number(price) * 100),
          category,
          description,
          contents,
          visual,
          badge,
          available,
          archived: nextArchived,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The product could not be saved.");

      setArchived(nextArchived);
      setMessage(isNew ? "Product added." : nextArchived ? "Product archived." : "Product saved.");
      router.refresh();
      onSaved?.();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "The product could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const form = (
    <form className="admin-product-form" onSubmit={saveProduct}>
      <div className="admin-product-form-grid">
        <label><span>Product name</span><input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} required /></label>
        <label><span>Price (£)</span><input type="number" min="0.50" max="10000" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required /></label>
        <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value as ProductCategory)}>{PRODUCT_CATEGORIES.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label><span>Visual style</span><select value={visual} onChange={(event) => setVisual(event.target.value as ProductVisual)}>{PRODUCT_VISUALS.map((option) => <option key={option} value={option}>{option.replaceAll("-", " ")}</option>)}</select></label>
        <label className="admin-product-wide"><span>Description</span><textarea rows={3} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} required /></label>
        <label className="admin-product-wide"><span>Contents or details</span><textarea rows={2} maxLength={500} value={contents} onChange={(event) => setContents(event.target.value)} /></label>
        <label><span>Badge</span><input value={badge} maxLength={40} onChange={(event) => setBadge(event.target.value)} placeholder="Optional — e.g. Bestseller" /></label>
        <label className="admin-product-availability"><input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} /><span>Available to order</span></label>
      </div>
      <div className="admin-product-form-actions">
        <span className={isError ? "admin-save-message error" : "admin-save-message"} role={isError ? "alert" : "status"}>{message}</span>
        {!isNew && <button className="admin-archive-button" type="button" disabled={saving} onClick={() => saveProduct(undefined, !archived)}>{archived ? "Restore product" : "Archive product"}</button>}
        <button className="admin-save-product" type="submit" disabled={saving}>{saving ? "Saving…" : isNew ? "Add to catalogue" : "Save changes"}</button>
      </div>
    </form>
  );

  if (isNew) return form;

  return (
    <details className={archived ? "admin-product-card archived" : "admin-product-card"}>
      <summary>
        <div className="admin-product-thumb" aria-hidden="true"><div className={`product-art ${visual}`}><span className="object-one" /><span className="object-two" /><span className="object-three" /></div></div>
        <div><small>{category}</small><strong>{name}</strong><span>£{Number(price).toFixed(2)}</span></div>
        <span className={archived ? "admin-product-state archived" : available ? "admin-product-state live" : "admin-product-state sold-out"}>{archived ? "Archived" : available ? "Live" : "Sold out"}</span>
        <span className="admin-product-edit-label">Edit</span>
      </summary>
      {form}
    </details>
  );
}
