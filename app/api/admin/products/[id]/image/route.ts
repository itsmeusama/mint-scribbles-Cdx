import { getD1, getProductImagesBucket } from "../../../../../../db";
import { productImageUrl } from "../../../../../../lib/catalog";
import { getMintAdminApiAccess } from "../../../../../admin-access";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type ProductRow = { id: string };

async function matchesImageType(image: File) {
  const bytes = new Uint8Array(await image.slice(0, 12).arrayBuffer());
  if (image.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (image.type === "image/png") return bytes.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]);
  if (image.type === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

async function requireOwner() {
  const access = await getMintAdminApiAccess();
  if (!access.user) return Response.json({ error: "Sign in is required." }, { status: 401 });
  if (!access.isOwner) return Response.json({ error: "Owner access is required." }, { status: 403 });
  return null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireOwner();
  if (denied) return denied;

  let uploadedKey = "";
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_IMAGE_BYTES + 1024 * 1024) {
      return Response.json({ error: "The image must be 5MB or smaller." }, { status: 400 });
    }
    const { id } = await context.params;
    const d1 = getD1();
    const product = await d1.prepare("SELECT id FROM products WHERE id = ?").bind(id).first<ProductRow>();
    if (!product) return Response.json({ error: "Product not found." }, { status: 404 });

    const form = await request.formData();
    const image = form.get("image");
    const imageAlt = typeof form.get("alt") === "string" ? String(form.get("alt")).trim().slice(0, 180) : "";
    if (!(image instanceof File) || image.size === 0) {
      return Response.json({ error: "Choose a JPG, PNG or WebP product image." }, { status: 400 });
    }
    const extension = IMAGE_TYPES.get(image.type);
    if (!extension) {
      return Response.json({ error: "Only JPG, PNG and WebP images are supported." }, { status: 400 });
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return Response.json({ error: "The image must be 5MB or smaller." }, { status: 400 });
    }
    if (!await matchesImageType(image)) {
      return Response.json({ error: "The selected file does not appear to be a valid image." }, { status: 400 });
    }
    if (imageAlt.length < 2) {
      return Response.json({ error: "Add a short image description for accessibility." }, { status: 400 });
    }

    uploadedKey = `product-${crypto.randomUUID()}.${extension}`;
    const bucket = getProductImagesBucket();
    await bucket.put(uploadedKey, image.stream(), {
      httpMetadata: {
        contentType: image.type,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: { productId: id },
    });

    const result = await d1.prepare(`
      UPDATE products
      SET image_key = ?, image_alt = ?, image_mime_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(uploadedKey, imageAlt, image.type, id).run();

    if (!result.meta.changes) {
      await bucket.delete(uploadedKey);
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    return Response.json({ imageUrl: productImageUrl(uploadedKey), imageAlt });
  } catch {
    if (uploadedKey) await getProductImagesBucket().delete(uploadedKey).catch(() => undefined);
    return Response.json({ error: "The image could not be uploaded." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireOwner();
  if (denied) return denied;

  try {
    const { id } = await context.params;
    const payload = await request.json() as { alt?: unknown };
    const imageAlt = typeof payload.alt === "string" ? payload.alt.trim().slice(0, 180) : "";
    if (imageAlt.length < 2) {
      return Response.json({ error: "Add a short image description for accessibility." }, { status: 400 });
    }

    const result = await getD1().prepare(`
      UPDATE products
      SET image_alt = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND image_key != ''
    `).bind(imageAlt, id).run();
    if (!result.meta.changes) return Response.json({ error: "Product image not found." }, { status: 404 });

    return Response.json({ imageAlt });
  } catch {
    return Response.json({ error: "The image description could not be saved." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireOwner();
  if (denied) return denied;

  try {
    const { id } = await context.params;
    const result = await getD1().prepare(`
      UPDATE products
      SET image_key = '', image_alt = '', image_mime_type = '', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();
    if (!result.meta.changes) return Response.json({ error: "Product not found." }, { status: 404 });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "The image could not be removed." }, { status: 500 });
  }
}
