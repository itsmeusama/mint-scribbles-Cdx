import { getProductImagesBucket } from "../../../../db";

const PRODUCT_IMAGE_KEY = /^product-[0-9a-f-]+\.(?:jpg|png|webp)$/;

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await context.params;
    if (!PRODUCT_IMAGE_KEY.test(key)) {
      return Response.json({ error: "Image not found." }, { status: 404 });
    }

    const image = await getProductImagesBucket().get(key);
    if (!image) return Response.json({ error: "Image not found." }, { status: 404 });

    const headers = new Headers();
    image.writeHttpMetadata(headers);
    headers.set("etag", image.httpEtag);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    headers.set("x-content-type-options", "nosniff");

    return new Response(image.body, { headers });
  } catch {
    return Response.json({ error: "The image is temporarily unavailable." }, { status: 500 });
  }
}
