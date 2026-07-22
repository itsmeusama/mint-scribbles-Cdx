import { getD1 } from "../../../../../db";
import { isOrderStatus } from "../../../../../lib/orders";
import { getMintAdminApiAccess } from "../../../../admin-access";

type UpdateOrderRequest = {
  status?: unknown;
  adminNotes?: unknown;
};

function cleanNotes(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 2000) : "";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await getMintAdminApiAccess();
  if (!access.user) {
    return Response.json({ error: "Sign in is required." }, { status: 401 });
  }
  if (!access.isOwner) {
    return Response.json({ error: "Owner access is required." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const payload = (await request.json()) as UpdateOrderRequest;
    if (!isOrderStatus(payload.status)) {
      return Response.json({ error: "Choose a valid order status." }, { status: 400 });
    }

    const adminNotes = cleanNotes(payload.adminNotes);
    const d1 = getD1();
    const existing = await d1
      .prepare("SELECT status FROM orders WHERE id = ?")
      .bind(id)
      .first<{ status: string }>();

    if (!existing) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    if (existing.status === payload.status) {
      await d1.prepare(`
        UPDATE orders
        SET admin_notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(adminNotes, id).run();
    } else {
      await d1.batch([
        d1.prepare(`
          UPDATE orders
          SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP,
              status_updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(payload.status, adminNotes, id),
        d1.prepare(`
          INSERT INTO order_status_history (order_id, status, changed_by)
          VALUES (?, ?, ?)
        `).bind(id, payload.status, access.user.email),
      ]);
    }

    return Response.json({ ok: true, status: payload.status });
  } catch {
    return Response.json(
      { error: "The order could not be updated. Please try again." },
      { status: 500 },
    );
  }
}
