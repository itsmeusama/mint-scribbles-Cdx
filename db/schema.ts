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
  subtotalPence: integer("subtotal_pence").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("orders_created_at_idx").on(table.createdAt),
  index("orders_status_idx").on(table.status),
]);

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  unitPricePence: integer("unit_price_pence").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalPence: integer("line_total_pence").notNull(),
}, (table) => [
  index("order_items_order_id_idx").on(table.orderId),
]);
