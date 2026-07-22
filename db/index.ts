import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  const d1 = getD1();

  return drizzle(d1, { schema });
}

export function getD1() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return env.DB;
}

export function getProductImagesBucket() {
  const bucket = (env as typeof env & { PRODUCT_IMAGES?: R2Bucket }).PRODUCT_IMAGES;
  if (!bucket) {
    throw new Error(
      "Cloudflare R2 binding `PRODUCT_IMAGES` is unavailable. Set the `r2` field in .openai/hosting.json to `PRODUCT_IMAGES`."
    );
  }

  return bucket;
}
