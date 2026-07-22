import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  collectionDay: text("collection_day").notNull(),
  paymentMethod: text("payment_method").notNull(),
  notes: text("notes").notNull().default(""),
  subtotalLkr: integer("subtotal_pence").notNull(),
  status: text("status").notNull().default("new"),
  adminNotes: text("admin_notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(""),
  statusUpdatedAt: text("status_updated_at").notNull().default(""),
}, (table) => [
  index("orders_created_at_idx").on(table.createdAt),
  index("orders_status_idx").on(table.status),
]);

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  unitPriceLkr: integer("unit_price_pence").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalLkr: integer("line_total_pence").notNull(),
  productVisual: text("product_visual").notNull().default("notebook"),
  productImageKey: text("product_image_key").notNull().default(""),
  productImageAlt: text("product_image_alt").notNull().default(""),
}, (table) => [
  index("order_items_order_id_idx").on(table.orderId),
]);

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  priceLkr: integer("price_pence").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  contents: text("contents").notNull().default(""),
  visual: text("visual").notNull(),
  badge: text("badge").notNull().default(""),
  imageKey: text("image_key").notNull().default(""),
  imageAlt: text("image_alt").notNull().default(""),
  imageMimeType: text("image_mime_type").notNull().default(""),
  available: integer("available", { mode: "boolean" }).notNull().default(true),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(""),
}, (table) => [
  index("products_category_idx").on(table.category),
  index("products_available_idx").on(table.available),
  index("products_archived_idx").on(table.archived),
  index("products_sort_order_idx").on(table.sortOrder),
]);

export const orderStatusHistory = sqliteTable("order_status_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  changedBy: text("changed_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("order_status_history_order_id_idx").on(table.orderId),
  index("order_status_history_created_at_idx").on(table.createdAt),
]);
