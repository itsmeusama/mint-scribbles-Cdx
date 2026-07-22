"use client";
/* eslint-disable @next/next/no-img-element -- R2 images are served by the app's immutable image endpoint. */

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_VISUALS,
  type Product,
  type ProductCategory,
  type ProductVisual,
} from "../../../lib/catalog";
import { formatLkr } from "../../../lib/money";

type ManagedProduct = Product & { archived: boolean; sortOrder: number };

const emptyProduct: ManagedProduct = {
  id: "",
  name: "",
  price: 1000,
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
  const [price, setPrice] = useState(product.price.toFixed(0));
  const [category, setCategory] = useState<ProductCategory>(product.category);
  const [description, setDescription] = useState(product.description);
  const [contents, setContents] = useState(product.contents ?? "");
  const [visual, setVisual] = useState<ProductVisual>(product.visual);
  const [badge, setBadge] = useState(product.badge ?? "");
  const [available, setAvailable] = useState(product.available);
  const [archived, setArchived] = useState(Boolean(product.archived));
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? "");
  const [imageAlt, setImageAlt] = useState(product.imageAlt ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMessage, setImageMessage] = useState("");
  const [imageError, setImageError] = useState(false);
  const [createdProductId, setCreatedProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function saveProduct(event?: FormEvent<HTMLFormElement>, archivedOverride?: boolean) {
    event?.preventDefault();
    if (saving) return;
    const nextArchived = archivedOverride ?? archived;
    if (archivedOverride === true && !window.confirm(`Archive ${name}? It will disappear from the shop but remain on past orders.`)) return;
    if (isNew && imageFile && imageAlt.trim().length < 2) {
      setImageError(true);
      setImageMessage("Add a short description of the photograph.");
      return;
    }

    setSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const creatingProduct = isNew && !createdProductId;
      const productId = createdProductId || product.id;
      const response = await fetch(creatingProduct ? "/api/admin/products" : `/api/admin/products/${encodeURIComponent(productId)}`, {
        method: creatingProduct ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          priceLkr: Math.round(Number(price)),
          category,
          description,
          contents,
          visual,
          badge,
          available,
          archived: nextArchived,
        }),
      });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "The product could not be saved.");

      const savedProductId = creatingProduct ? result.id : productId;
      if (!savedProductId) throw new Error("The new product was saved without a usable reference.");

      if (isNew && imageFile) {
        try {
          await uploadSelectedImage(savedProductId);
        } catch (error) {
          setCreatedProductId(savedProductId);
          setIsError(true);
          setMessage(`Product saved, but its photograph was not uploaded. ${error instanceof Error ? error.message : "Choose Retry photograph upload."}`);
          router.refresh();
          return;
        }
      }

      setArchived(nextArchived);
      setMessage(isNew ? imageFile ? "Product and photograph added." : "Product added." : nextArchived ? "Product archived." : "Product saved.");
      if (isNew && imagePreview) URL.revokeObjectURL(imagePreview);
      if (isNew) {
        setImageFile(null);
        setImagePreview("");
      }
      router.refresh();
      onSaved?.();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "The product could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadSelectedImage(productId: string) {
    if (!imageFile) return;
    const body = new FormData();
    body.set("image", imageFile);
    body.set("alt", imageAlt);
    const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/image`, { method: "POST", body });
    const result = await response.json() as { imageUrl?: string; imageAlt?: string; error?: string };
    if (!response.ok || !result.imageUrl) throw new Error(result.error || "The photograph could not be uploaded. Choose Retry photograph upload.");
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageMessage("");
    setImageError(false);
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError(true);
      setImageMessage("Choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError(true);
      setImageMessage("The image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (!imageAlt.trim()) setImageAlt(`Photograph of ${name || "the product"}`);
  }

  async function uploadImage() {
    if ((!imageFile && !imageUrl) || uploadingImage) return;
    if (imageAlt.trim().length < 2) {
      setImageError(true);
      setImageMessage("Add a short description of the photograph.");
      return;
    }

    setUploadingImage(true);
    setImageMessage("");
    setImageError(false);
    try {
      const body = imageFile ? new FormData() : JSON.stringify({ alt: imageAlt });
      if (body instanceof FormData && imageFile) {
        body.set("image", imageFile);
        body.set("alt", imageAlt);
      }
      const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}/image`, {
        method: imageFile ? "POST" : "PATCH",
        headers: imageFile ? undefined : { "content-type": "application/json" },
        body,
      });
      const result = await response.json() as { imageUrl?: string; imageAlt?: string; error?: string };
      if (!response.ok || (imageFile && !result.imageUrl)) throw new Error(result.error || "The image details could not be saved.");

      if (imageFile && imagePreview) URL.revokeObjectURL(imagePreview);
      setImageUrl(result.imageUrl ?? imageUrl);
      setImageAlt(result.imageAlt ?? imageAlt);
      setImageFile(null);
      setImagePreview("");
      setImageMessage(imageFile ? "Product photograph uploaded." : "Image description saved.");
      router.refresh();
    } catch (error) {
      setImageError(true);
      setImageMessage(error instanceof Error ? error.message : "The image could not be uploaded.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function removeImage() {
    if (uploadingImage || !window.confirm(`Remove the photograph from ${name}? The visual style will be used instead.`)) return;
    setUploadingImage(true);
    setImageMessage("");
    setImageError(false);
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}/image`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The image could not be removed.");
      setImageUrl("");
      setImageAlt("");
      setImageFile(null);
      setImagePreview("");
      setImageMessage("Product photograph removed. The visual fallback is active.");
      router.refresh();
    } catch (error) {
      setImageError(true);
      setImageMessage(error instanceof Error ? error.message : "The image could not be removed.");
    } finally {
      setUploadingImage(false);
    }
  }

  const form = (
    <form className="admin-product-form" onSubmit={saveProduct}>
      <section className="admin-product-image-editor" aria-label="Product photograph">
          <div className="admin-product-image-preview">
            {imagePreview || imageUrl ? <img src={imagePreview || imageUrl} alt={imageAlt || "Selected product photograph"} /> : <div className={`product-art ${visual}`} aria-hidden="true"><span className="object-one" /><span className="object-two" /><span className="object-three" /></div>}
          </div>
          <div className="admin-product-image-controls">
            <div><strong>Product photograph</strong><span>JPG, PNG or WebP · maximum 5MB · one image per product</span></div>
            <label><span>Choose image</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} disabled={uploadingImage || saving} /></label>
            <label><span>Image description</span><input value={imageAlt} maxLength={180} onChange={(event) => setImageAlt(event.target.value)} placeholder="e.g. Sage notebook with gold pen" /></label>
            {isNew ? (
              <p className="admin-new-image-hint">{createdProductId ? "The product is saved. Check the image and select Retry photograph upload." : "The photograph will upload automatically when you add the product."}</p>
            ) : (
              <div className="admin-product-image-actions">
                <button type="button" onClick={uploadImage} disabled={(!imageFile && !imageUrl) || uploadingImage}>{uploadingImage ? "Working…" : imageFile ? imageUrl ? "Replace photograph" : "Upload photograph" : "Save image description"}</button>
                {imageUrl && <button className="admin-remove-image" type="button" onClick={removeImage} disabled={uploadingImage}>Remove photograph</button>}
              </div>
            )}
            <span className={imageError ? "admin-image-message error" : "admin-image-message"} role={imageError ? "alert" : "status"}>{imageMessage}</span>
          </div>
        </section>
      <div className="admin-product-form-grid">
        <label><span>Product name</span><input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} required /></label>
        <label><span>Price (LKR)</span><input type="number" min="50" max="10000000" step="1" value={price} onChange={(event) => setPrice(event.target.value)} required /></label>
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
        <button className="admin-save-product" type="submit" disabled={saving || uploadingImage}>{saving ? imageFile ? "Saving product & photograph…" : "Saving…" : isNew ? createdProductId ? "Retry photograph upload" : imageFile ? "Add product & photograph" : "Add to catalogue" : "Save changes"}</button>
      </div>
    </form>
  );

  if (isNew) return form;

  return (
    <details className={archived ? "admin-product-card archived" : "admin-product-card"}>
      <summary>
        <div className="admin-product-thumb" aria-hidden="true">{imageUrl ? <img src={imageUrl} alt="" /> : <div className={`product-art ${visual}`}><span className="object-one" /><span className="object-two" /><span className="object-three" /></div>}</div>
        <div><small>{category}</small><strong>{name}</strong><span>{formatLkr(Number(price))}</span></div>
        <span className={archived ? "admin-product-state archived" : available ? "admin-product-state live" : "admin-product-state sold-out"}>{archived ? "Archived" : available ? "Live" : "Sold out"}</span>
        <span className="admin-product-edit-label">Edit</span>
      </summary>
      {form}
    </details>
  );
}
