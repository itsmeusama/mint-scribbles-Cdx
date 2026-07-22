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
  assert.match(route, /findProduct\(productId\)/);
  assert.match(route, /Math\.round\(product\.price \* 100\)/);
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
  assert.match(adminOrders, /findProduct\(item\.productId\)/);
  assert.match(adminOrders, /admin-order-product-thumb/);
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
