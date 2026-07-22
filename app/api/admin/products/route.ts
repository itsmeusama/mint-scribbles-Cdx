import { getD1 } from "../../../../db";
import { getMintAdminApiAccess } from "../../../admin-access";
import { parseProductInput } from "../../../../lib/product-validation";

export async function POST(request: Request) {
  const access = await getMintAdminApiAccess();
  if (!access.user) return Response.json({ error: "Sign in is required." }, { status: 401 });
  if (!access.isOwner) return Response.json({ error: "Owner access is required." }, { status: 403 });

  try {
    const parsed = parseProductInput(await request.json() as Record<string, unknown>);
    if (parsed.error) return Response.json({ error: parsed.error }, { status: 400 });

    const product = parsed.value;
    const d1 = getD1();
    const order = await d1.prepare("SELECT COALESCE(MAX(sort_order), 0) + 10 AS next_order FROM products").first<{ next_order: number }>();
    const id = crypto.randomUUID();

    await d1.prepare(`
      INSERT INTO products (
        id, name, price_pence, category, description, contents, visual,
        badge, available, archived, sort_order, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      id,
      product.name,
      product.pricePence,
      product.category,
      product.description,
      product.contents,
      product.visual,
      product.badge,
      product.available ? 1 : 0,
      product.archived ? 1 : 0,
      order?.next_order ?? 10,
    ).run();

    return Response.json({ id }, { status: 201 });
  } catch {
    return Response.json({ error: "The product could not be created." }, { status: 500 });
  }
}
