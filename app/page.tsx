"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Product } from "../lib/catalog";

type CartItem = Product & { quantity: number };

const money = (value: number) => `£${value.toFixed(2)}`;

export default function Home() {
  const [catalogue, setCatalogue] = useState<Product[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [builder, setBuilder] = useState<string[]>(["notebook", "weekly-pad"]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderReference, setOrderReference] = useState("");
  const [orderError, setOrderError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [toast, setToast] = useState("");

  const bundles = catalogue.filter((product) => product.category === "Bundle");
  const individualItems = catalogue.filter((product) => product.category === "Individual");

  useEffect(() => {
    let active = true;
    fetch("/api/catalog", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { products?: Product[]; error?: string };
        if (!response.ok || !result.products) throw new Error(result.error || "The catalogue could not be loaded.");
        if (active) setCatalogue(result.products);
      })
      .catch((error) => {
        if (active) setCatalogueError(error instanceof Error ? error.message : "The catalogue could not be loaded.");
      })
      .finally(() => {
        if (active) setCatalogueLoading(false);
      });

    return () => { active = false; };
  }, []);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const builderItems = individualItems.filter((item) => builder.includes(item.id));
  const builderPrice = Math.max(0, builderItems.reduce((sum, item) => sum + item.price, 0) - (builderItems.length >= 4 ? 3 : 0));

  const addToCart = (product: Product) => {
    if (!product.available) return;
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      return existing
        ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }];
    });
    setToast(`${product.name} added to your bag.`);
    window.setTimeout(() => setToast(""), 2600);
  };

  const updateQuantity = (id: string, next: number) => {
    setCart((current) => next < 1
      ? current.filter((item) => item.id !== id)
      : current.map((item) => item.id === id ? { ...item, quantity: next } : item));
  };

  const toggleBuilderItem = (id: string) => {
    setBuilder((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const openCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
    setOrderPlaced(false);
    setOrderReference("");
    setOrderError("");
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingOrder) return;

    const data = new FormData(event.currentTarget);
    setSubmittingOrder(true);
    setOrderError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          collectionDay: data.get("collection"),
          paymentMethod: data.get("payment"),
          notes: data.get("notes"),
          items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
        }),
      });
      const result = await response.json() as { reference?: string; error?: string };
      if (!response.ok || !result.reference) {
        throw new Error(result.error || "We could not save your order just now.");
      }

      setOrderReference(result.reference);
      setOrderPlaced(true);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : "We could not save your order just now.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <main>
      <div className="announcement">Complimentary collection from our London studio · Bank deposit & pay at collection available</div>

      <header className="site-header">
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="main-nav">Menu</button>
        <a className="brand" href="#top" aria-label="Mint Scribbles home">
          <span>Mint Scribbles</span>
          <small>Stationery studio</small>
        </a>
        <nav id="main-nav" className={menuOpen ? "nav open" : "nav"} aria-label="Main navigation">
          <a href="#bundles" onClick={() => setMenuOpen(false)}>Shop bundles</a>
          <a href="#pieces" onClick={() => setMenuOpen(false)}>Individual pieces</a>
          <span className="nav-coming" aria-disabled="true">Custom bundles <small>Coming soon</small></span>
          <a href="#story" onClick={() => setMenuOpen(false)}>Our story</a>
        </nav>
        <button className="bag-button" onClick={() => setCartOpen(true)} aria-label={`Open bag with ${itemCount} items`}>
          Bag <span>{itemCount}</span>
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Curated for the everyday</p>
          <h1>Thoughtful stationery, <em>bundled beautifully.</em></h1>
          <p className="hero-intro">Considered paper goods for desks, studies and handwritten moments. Choose a ready-made edit or shop the individual pieces you love. Custom bundles are coming soon.</p>
          <div className="hero-actions">
            <a className="button primary" href="#bundles">Shop curated bundles</a>
            <span className="button secondary disabled-action" aria-disabled="true">Custom bundles · Coming soon</span>
          </div>
          <p className="payment-note"><span>✓</span> No online payment needed — reserve now, pay by deposit or at collection.</p>
        </div>
        <div className="hero-art" aria-label="A stationery box, notebook, envelope and pencil arranged on a sage background">
          <span className="leaf leaf-one" />
          <span className="leaf leaf-two" />
          <div className="parcel-box"><span>The Desk Reset</span><small>Curated stationery box</small></div>
          <div className="hero-notebook"><span>Notes for<br />slow mornings</span><small>Layflat notebook · sage</small><i /><i /><i /></div>
          <div className="hero-envelope" />
          <div className="hero-pencil" />
          <p className="studio-mark">Studio edit · No. 04</p>
        </div>
      </section>

      <section className="trust-strip" aria-label="Shopping benefits">
        <p><strong>01</strong> Curated with care, never filler</p>
        <p><strong>02</strong> Shop bundles or individual pieces</p>
        <p><strong>03</strong> Ready to collect in 2–3 days</p>
      </section>

      <section className="shop-section" id="bundles">
        <div className="section-heading">
          <div><p className="eyebrow">Ready-made edits</p><h2>Bundles for every kind of day</h2></div>
          <a href="#pieces">Prefer to choose each piece? <span>→</span></a>
        </div>
        <div className="product-grid bundle-grid">
          {catalogueLoading ? <CatalogueMessage>Loading the collection…</CatalogueMessage> : catalogueError ? <CatalogueMessage>{catalogueError}</CatalogueMessage> : bundles.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
        </div>
      </section>

      <section className="build-section coming-soon-section" id="build" aria-labelledby="custom-bundle-title">
        <div className="builder-copy">
          <p className="eyebrow light">Coming soon</p>
          <h2 id="custom-bundle-title">Custom bundles are on their way.</h2>
          <p>We are preparing a new way to choose your favourite pieces and have them wrapped together. This feature is not available to order just yet.</p>
          <ul>
            <li>Choose exactly what goes inside</li>
            <li>Create thoughtful gifts for any occasion</li>
            <li>Add a complimentary handwritten note</li>
          </ul>
        </div>
        <div className="builder-panel">
          <div className="builder-coming-badge">Preview · Coming soon</div>
          <div className="builder-title"><span>Choose your pieces</span><strong>Not yet available</strong></div>
          <div className="builder-options">
            {individualItems.map((item) => (
              <label key={item.id} className={builder.includes(item.id) ? "builder-option selected locked" : "builder-option locked"} aria-disabled="true">
                <input type="checkbox" checked={builder.includes(item.id)} onChange={() => toggleBuilderItem(item.id)} disabled />
                <span className={`mini-visual ${item.visual}`} aria-hidden="true" />
                <span><strong>{item.name}</strong><small>{money(item.price)}</small></span>
              </label>
            ))}
          </div>
          <div className="builder-total">
            <span><small>Custom bundle total</small><strong>{money(builderPrice)}</strong></span>
            <button className="button blush" disabled>Coming soon</button>
          </div>
          <p className="builder-hint">Custom bundle ordering will be enabled in a future update.</p>
        </div>
      </section>

      <section className="shop-section pieces-section" id="pieces">
        <div className="section-heading">
          <div><p className="eyebrow">The paper cupboard</p><h2>Lovely on their own, too</h2></div>
          <p>Build a set slowly, replace a favourite, or choose one small something.</p>
        </div>
        <div className="product-grid pieces-grid">
          {catalogueLoading ? <CatalogueMessage>Loading the paper cupboard…</CatalogueMessage> : catalogueError ? <CatalogueMessage>{catalogueError}</CatalogueMessage> : individualItems.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} compact />)}
        </div>
      </section>

      <section className="story-section" id="story">
        <div className="story-note"><span>A note from our table</span><p>“We choose stationery the way we choose books: for how it feels in the hand, how well it lasts, and the small ritual it creates.”</p><small>— The Mint Scribbles studio</small></div>
        <div className="story-copy"><p className="eyebrow">Small-batch, thoughtfully gathered</p><h2>Nothing added just to fill the box.</h2><p>Every Mint Scribbles edit is built around useful pieces from independent paper makers. We favour recycled stocks, low-plastic packaging and timeless details that will be used, not tucked away.</p><div className="story-stats"><span><strong>12</strong><small>Independent makers</small></span><span><strong>100%</strong><small>Plastic-free wrapping</small></span><span><strong>2–3 days</strong><small>Collection ready</small></span></div></div>
      </section>

      <section className="collection-section">
        <p className="eyebrow light">Simple ways to pay</p>
        <h2>Reserve today. Pay the way that suits you.</h2>
        <div className="payment-cards"><article><span>01</span><h3>Pay at collection</h3><p>Collect from our London studio and pay when your parcel is in your hands.</p></article><article><span>02</span><h3>Bank deposit</h3><p>Choose bank deposit at checkout. We will reply with account details and hold your order for 48 hours.</p></article><article><span>03</span><h3>Friendly confirmation</h3><p>We confirm the collection window and any gift-note details personally by email.</p></article></div>
      </section>

      <footer>
        <div className="footer-brand"><span>Mint Scribbles</span><small>Stationery for slower, lovelier moments.</small></div>
        <div><strong>Visit</strong><a href="#bundles">Curated bundles</a><a href="#pieces">Individual pieces</a><span className="footer-disabled">Custom bundles · Coming soon</span></div>
        <div><strong>Collection</strong><p>Tuesday–Saturday<br />10:00–17:00<br />London studio</p></div>
        <div><strong>Keep in touch</strong><a href="mailto:mohamedusama881@gmail.com">mohamedusama881@gmail.com</a></div>
        <p className="copyright">© 2026 Mint Scribbles · Made carefully, collected locally.</p>
      </footer>

      {toast && <div className="toast" role="status">{toast}<button onClick={() => setCartOpen(true)}>View bag</button></div>}

      <div className={cartOpen ? "overlay visible" : "overlay"} onClick={() => setCartOpen(false)} aria-hidden={!cartOpen} />
      <aside className={cartOpen ? "cart-drawer open" : "cart-drawer"} aria-hidden={!cartOpen} aria-label="Shopping bag">
        <div className="drawer-heading"><div><p className="eyebrow">Your selection</p><h2>Shopping bag</h2></div><button className="close-button" onClick={() => setCartOpen(false)} aria-label="Close bag">×</button></div>
        {cart.length === 0 ? <div className="empty-bag"><span>◇</span><h3>Your bag is waiting</h3><p>Begin with a ready-made edit or build a bundle of your own.</p><button className="button primary" onClick={() => setCartOpen(false)}>Continue shopping</button></div> : <>
          <div className="cart-items">{cart.map((item) => <article className="cart-item" key={item.id}><div className={`cart-thumb product-art ${item.visual}`} aria-hidden="true"><span className="object-one" /><span className="object-two" /></div><div><span className="cart-category">{item.category}</span><h3>{item.name}</h3><p>{money(item.price)}</p><div className="quantity"><button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Remove one ${item.name}`}>−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Add one ${item.name}`}>+</button></div></div><strong>{money(item.price * item.quantity)}</strong></article>)}</div>
          <div className="cart-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p>Collection is complimentary. No payment is taken online.</p><button className="button primary full" onClick={openCheckout}>Continue to checkout</button><button className="text-button" onClick={() => setCartOpen(false)}>Continue shopping</button></div>
        </>}
      </aside>

      {checkoutOpen && <div className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <button className="modal-backdrop" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout" />
        <div className="checkout-card">
          <button className="close-button" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout">×</button>
          {orderPlaced ? <div className="order-confirmation"><span>✓</span><p className="eyebrow">Order request received</p><h2>Thank you — your order is saved.</h2><p>We will confirm availability, collection and payment details personally by email.</p><div className="order-reference"><small>Your order reference</small><strong>{orderReference}</strong></div><button className="button primary" onClick={() => { setCheckoutOpen(false); setCart([]); }}>Done</button></div> : <form onSubmit={submitOrder}>
            <div className="checkout-heading"><p className="eyebrow">Reserve your order</p><h2 id="checkout-title">Collection checkout</h2><p>No payment is taken on this page.</p></div>
            <div className="checkout-layout"><div className="checkout-fields">
              <fieldset><legend>1. Your details</legend><label>Full name<input name="name" autoComplete="name" required /></label><div className="field-row"><label>Email<input type="email" name="email" autoComplete="email" required /></label><label>Phone<input type="tel" name="phone" autoComplete="tel" required /></label></div></fieldset>
              <fieldset><legend>2. Collection</legend><label>Preferred collection day<select name="collection" required defaultValue=""><option value="" disabled>Choose a day</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option></select></label><label>Gift note or order notes<textarea name="notes" rows={3} placeholder="Optional" /></label></fieldset>
              <fieldset><legend>3. Payment choice</legend><label className="payment-option"><input type="radio" name="payment" value="collection" defaultChecked /><span><strong>Pay at collection</strong><small>Pay when you collect your parcel.</small></span></label><label className="payment-option"><input type="radio" name="payment" value="deposit" /><span><strong>Bank deposit</strong><small>Account details are sent after we receive your request.</small></span></label></fieldset>
            </div><aside className="order-summary"><h3>Your order</h3>{cart.map((item) => <p key={item.id}><span>{item.quantity} × {item.name}</span><strong>{money(item.price * item.quantity)}</strong></p>)}<div><span>Total</span><strong>{money(subtotal)}</strong></div><small>By placing this request, you agree that availability and collection time will be confirmed by email.</small>{orderError && <p className="checkout-error" role="alert">{orderError}</p>}<button className="button primary full" type="submit" disabled={submittingOrder}>{submittingOrder ? "Saving your order…" : "Place order request"}</button></aside></div>
          </form>}
        </div>
      </div>}
    </main>
  );
}

function ProductCard({ product, onAdd, compact = false }: { product: Product; onAdd: (product: Product) => void; compact?: boolean }) {
  return <article className={compact ? "product-card compact" : "product-card"}>
    <div className={`product-art ${product.visual}`} aria-hidden="true"><span className="object-one" /><span className="object-two" /><span className="object-three" />{product.available ? product.badge && <small>{product.badge}</small> : <small className="sold-out-badge">Sold out</small>}</div>
    <div className="product-info"><div><span>{product.category}</span><h3>{product.name}</h3></div><strong>{money(product.price)}</strong><p>{product.description}</p>{product.contents && <small className="contents">{product.contents}</small>}<button onClick={() => onAdd(product)} disabled={!product.available}>{product.available ? <>Add to bag <span>＋</span></> : "Currently unavailable"}</button></div>
  </article>;
}

function CatalogueMessage({ children }: { children: React.ReactNode }) {
  return <p className="catalogue-message" role="status">{children}</p>;
}
