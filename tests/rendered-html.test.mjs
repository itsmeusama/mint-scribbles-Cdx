import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("checkout sends product identifiers to the server-authoritative order API", async () => {
  const [page, route] = await Promise.all([
    source("app/page.tsx"),
    source("app/api/orders/route.ts"),
  ]);

  assert.match(page, /fetch\("\/api\/orders"/);
  assert.match(page, /productId: item\.id/);
  assert.match(route, /FROM products/);
  assert.match(route, /price_pence/);
  assert.match(route, /archived = 0 AND available = 1/);
  assert.doesNotMatch(page, /window\.location/);
});

test("the initial migration stores orders and their line items", async () => {
  const migration = await source("drizzle/0000_next_jasper_sitwell.sql");

  assert.match(migration, /CREATE TABLE `orders`/);
  assert.match(migration, /CREATE TABLE `order_items`/);
  assert.match(migration, /CREATE UNIQUE INDEX `orders_reference_unique`/);
  assert.match(migration, /ON DELETE cascade/);
});

test("the private admin inbox loads recent order and line-item records", async () => {
  const adminOrders = await source("app/admin/orders/page.tsx");

  assert.match(adminOrders, /getMintAdminAccess\("\/admin\/orders"\)/);
  assert.match(adminOrders, /\.from\(ordersTable\)/);
  assert.match(adminOrders, /\.from\(orderItems\)/);
  assert.match(adminOrders, /\.limit\(100\)/);
  assert.match(adminOrders, /item\.productVisual/);
  assert.match(adminOrders, /admin-order-product-thumb/);
});

test("Phase 5 uses one protected database-backed catalogue", async () => {
  const [storefront, catalogRoute, createRoute, updateRoute, manager, migration] = await Promise.all([
    source("app/page.tsx"),
    source("app/api/catalog/route.ts"),
    source("app/api/admin/products/route.ts"),
    source("app/api/admin/products/[id]/route.ts"),
    source("app/admin/products/ProductManager.tsx"),
    source("drizzle/0002_tranquil_alex_wilder.sql"),
  ]);

  assert.match(storefront, /fetch\("\/api\/catalog"/);
  assert.match(catalogRoute, /\.from\(products\)/);
  assert.match(createRoute, /getMintAdminApiAccess\(\)/);
  assert.match(updateRoute, /UPDATE products/);
  assert.match(manager, /Archive product/);
  assert.match(manager, /Available to order/);
  assert.match(migration, /CREATE TABLE `products`/);
  assert.match(migration, /'desk-reset', 'The Desk Reset'/);
  assert.match(migration, /ADD `product_visual`/);
});

test("Phase 5.1 stores validated photographs in R2 and preserves order image references", async () => {
  const [
    hosting,
    uploadRoute,
    imageRoute,
    catalogRoute,
    checkoutRoute,
    manager,
    storefront,
    adminOrders,
    migration,
  ] = await Promise.all([
    source(".openai/hosting.json"),
    source("app/api/admin/products/[id]/image/route.ts"),
    source("app/api/product-images/[key]/route.ts"),
    source("app/api/catalog/route.ts"),
    source("app/api/orders/route.ts"),
    source("app/admin/products/ProductManager.tsx"),
    source("app/page.tsx"),
    source("app/admin/orders/page.tsx"),
    source("drizzle/0003_typical_santa_claus.sql"),
  ]);

  assert.match(hosting, /"r2": "PRODUCT_IMAGES"/);
  assert.match(uploadRoute, /getMintAdminApiAccess\(\)/);
  assert.match(uploadRoute, /5 \* 1024 \* 1024/);
  assert.match(uploadRoute, /image\/jpeg/);
  assert.match(uploadRoute, /image\/png/);
  assert.match(uploadRoute, /image\/webp/);
  assert.match(uploadRoute, /bucket\.put/);
  assert.match(imageRoute, /max-age=31536000, immutable/);
  assert.match(catalogRoute, /productImageUrl\(product\.imageKey\)/);
  assert.match(checkoutRoute, /product_image_key/);
  assert.match(manager, /Upload photograph/);
  assert.match(manager, /Remove photograph/);
  assert.match(storefront, /product\.imageUrl/);
  assert.match(adminOrders, /item\.productImageKey/);
  assert.match(migration, /ADD `product_image_key`/);
  assert.match(migration, /ADD `image_key`/);
});

test("Phase 3 order management is owner-protected and durable", async () => {
  const [actions, route, migration] = await Promise.all([
    source("app/admin/orders/OrderActions.tsx"),
    source("app/api/admin/orders/[id]/route.ts"),
    source("drizzle/0001_safe_gertrude_yorkes.sql"),
  ]);

  assert.match(actions, /method: "PATCH"/);
  assert.match(actions, /Private admin notes/);
  assert.match(route, /getMintAdminApiAccess\(\)/);
  assert.match(route, /INSERT INTO order_status_history/);
  assert.match(migration, /CREATE TABLE `order_status_history`/);
  assert.match(migration, /ALTER TABLE `orders` ADD `admin_notes`/);
  assert.match(migration, /Phase 3 migration/);
});
