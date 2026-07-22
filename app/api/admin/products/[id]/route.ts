import { getD1 } from "../../../../../db";
import { parseProductInput } from "../../../../../lib/product-validation";
import { getMintAdminApiAccess } from "../../../../admin-access";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await getMintAdminApiAccess();
  if (!access.user) return Response.json({ error: "Sign in is required." }, { status: 401 });
  if (!access.isOwner) return Response.json({ error: "Owner access is required." }, { status: 403 });

  try {
    const { id } = await context.params;
    const parsed = parseProductInput(await request.json() as Record<string, unknown>);
    if (parsed.error) return Response.json({ error: parsed.error }, { status: 400 });
    const product = parsed.value;

    const result = await getD1().prepare(`
      UPDATE products
      SET name = ?, price_pence = ?, category = ?, description = ?, contents = ?,
          visual = ?, badge = ?, available = ?, archived = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      product.name,
      product.pricePence,
      product.category,
      product.description,
      product.contents,
      product.visual,
      product.badge,
      product.available ? 1 : 0,
      product.archived ? 1 : 0,
      id,
    ).run();

    if (!result.meta.changes) return Response.json({ error: "Product not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "The product could not be updated." }, { status: 500 });
  }
}
