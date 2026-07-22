"use client";
/* eslint-disable @next/next/no-img-element -- Order snapshots use the app's R2 image endpoint. */

import { FormEvent, useState } from "react";
import { formatLkr } from "../../lib/money";
import type { OrderStatus } from "../../lib/orders";

type TrackedOrder = {
  reference: string;
  customerName: string;
  collectionDay: string;
  paymentMethod: string;
  subtotalLkr: number;
  status: OrderStatus;
  statusLabel: string;
  statusMessage: string;
  createdAt: string;
  statusUpdatedAt: string;
  items: Array<{
    id: number;
    productName: string;
    unitPriceLkr: number;
    quantity: number;
    lineTotalLkr: number;
    imageUrl?: string;
    imageAlt: string;
  }>;
  history: Array<{
    id: number;
    status: OrderStatus;
    label: string;
    message: string;
    createdAt: string;
  }>;
};

function formatDateTime(value: string) {
  const parsed = new Date(`${value.replace(" ", "T")}Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo",
  }).format(parsed);
}

export default function TrackOrder() {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function findOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference: data.get("reference"), email: data.get("email") }),
      });
      const result = await response.json() as { order?: TrackedOrder; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error || "We could not find that order.");
      setOrder(result.order);
    } catch (cause) {
      setOrder(null);
      setError(cause instanceof Error ? cause.message : "We could not find that order.");
    } finally {
      setLoading(false);
    }
  }

  if (!order) {
    return (
      <section className="tracking-shell">
        <div className="tracking-intro">
          <p className="eyebrow">Phase 4 order tracking</p>
          <h1>Follow your order from request to collection.</h1>
          <p>Enter the reference shown after checkout and the same email used for the order.</p>
        </div>
        <form className="tracking-form" onSubmit={findOrder}>
          <label>
            <span>Order reference</span>
            <input name="reference" inputMode="text" autoCapitalize="characters" placeholder="MS-260722-ABC123" required />
          </label>
          <label>
            <span>Order email</span>
            <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          </label>
          {error && <p className="tracking-error" role="alert">{error}</p>}
          <button className="button primary full" type="submit" disabled={loading}>{loading ? "Checking your order…" : "Check order status"}</button>
          <small>Your reference and email are checked together to keep order details private.</small>
        </form>
      </section>
    );
  }

  return (
    <section className="tracking-result">
      <div className="tracking-result-heading">
        <div><p className="eyebrow">Order {order.reference}</p><h1>Hello, {order.customerName}.</h1></div>
        <button type="button" onClick={() => { setOrder(null); setError(""); }}>Check another order</button>
      </div>

      <article className={`tracking-current status-${order.status}`}>
        <div><small>Current status</small><strong>{order.statusLabel}</strong></div>
        <p>{order.statusMessage}</p>
        <span>Updated {formatDateTime(order.statusUpdatedAt)}</span>
      </article>

      <div className="tracking-summary">
        <article><small>Collection day</small><strong>{order.collectionDay}</strong><span>Sri Lanka local collection</span></article>
        <article><small>Payment</small><strong>{order.paymentMethod === "deposit" ? "Bank deposit" : "Pay at collection"}</strong><span>No online payment taken</span></article>
        <article><small>Order total</small><strong>{formatLkr(order.subtotalLkr)}</strong><span>Placed {formatDateTime(order.createdAt)}</span></article>
      </div>

      <div className="tracking-content-grid">
        <section className="tracking-items" aria-labelledby="tracking-items-title">
          <div className="tracking-section-heading"><p className="eyebrow">Your selection</p><h2 id="tracking-items-title">Order items</h2></div>
          {order.items.map((item) => (
            <article key={item.id}>
              <div className="tracking-item-image">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt || item.productName} /> : <span aria-hidden="true">◇</span>}
              </div>
              <div><strong>{item.quantity} × {item.productName}</strong><span>{formatLkr(item.unitPriceLkr)} each</span></div>
              <strong>{formatLkr(item.lineTotalLkr)}</strong>
            </article>
          ))}
        </section>

        <section className="tracking-timeline" aria-labelledby="tracking-timeline-title">
          <div className="tracking-section-heading"><p className="eyebrow">Status updates</p><h2 id="tracking-timeline-title">Order timeline</h2></div>
          <ol>
            {order.history.map((entry, index) => (
              <li key={entry.id} className={index === 0 ? "latest" : ""}>
                <span aria-hidden="true" />
                <div><strong>{entry.label}</strong><p>{entry.message}</p><small>{formatDateTime(entry.createdAt)}</small></div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}
