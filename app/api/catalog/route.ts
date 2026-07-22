import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { products } from "../../../db/schema";
import { isProductCategory, isProductVisual, productImageUrl } from "../../../lib/catalog";

export async function GET() {
  try {
    const rows = await getDb()
      .select()
      .from(products)
      .where(eq(products.archived, false))
      .orderBy(asc(products.category), asc(products.sortOrder), asc(products.name));

    return Response.json({
      products: rows.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.priceLkr,
        category: isProductCategory(product.category) ? product.category : "Individual",
        description: product.description,
        contents: product.contents || undefined,
        visual: isProductVisual(product.visual) ? product.visual : "notebook",
        badge: product.badge || undefined,
        imageUrl: productImageUrl(product.imageKey),
        imageAlt: product.imageAlt || undefined,
        available: product.available,
        sortOrder: product.sortOrder,
      })),
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "The catalogue is temporarily unavailable." }, { status: 500 });
  }
}
