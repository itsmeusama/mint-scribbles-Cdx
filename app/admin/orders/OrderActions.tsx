"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "../../../lib/orders";

export default function OrderActions({
  orderId,
  currentStatus,
  currentNotes,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  currentNotes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [adminNotes, setAdminNotes] = useState(currentNotes);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function saveOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The order could not be updated.");

      setMessage("Order updated successfully.");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "The order could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-order-actions" onSubmit={saveOrder}>
      <div>
        <label htmlFor={`status-${orderId}`}>Order status</label>
        <select
          id={`status-${orderId}`}
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
        >
          {ORDER_STATUSES.map((option) => (
            <option key={option} value={option}>{ORDER_STATUS_LABELS[option]}</option>
          ))}
        </select>
      </div>
      <div className="admin-order-private-notes">
        <label htmlFor={`notes-${orderId}`}>Private admin notes</label>
        <textarea
          id={`notes-${orderId}`}
          rows={3}
          maxLength={2000}
          value={adminNotes}
          onChange={(event) => setAdminNotes(event.target.value)}
          placeholder="Add preparation details or an internal reminder. Customers cannot see this."
        />
      </div>
      <div className="admin-order-save-row">
        <span className={isError ? "admin-save-message error" : "admin-save-message"} role={isError ? "alert" : "status"}>
          {message}
        </span>
        <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save order"}</button>
      </div>
    </form>
  );
}
