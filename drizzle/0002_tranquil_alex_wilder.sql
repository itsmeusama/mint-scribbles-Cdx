CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price_pence` integer NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`contents` text DEFAULT '' NOT NULL,
	`visual` text NOT NULL,
	`badge` text DEFAULT '' NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `products_available_idx` ON `products` (`available`);--> statement-breakpoint
CREATE INDEX `products_archived_idx` ON `products` (`archived`);--> statement-breakpoint
CREATE INDEX `products_sort_order_idx` ON `products` (`sort_order`);--> statement-breakpoint
ALTER TABLE `order_items` ADD `product_visual` text DEFAULT 'notebook' NOT NULL;--> statement-breakpoint
INSERT INTO `products` (
	`id`, `name`, `price_pence`, `category`, `description`, `contents`, `visual`,
	`badge`, `available`, `archived`, `sort_order`, `updated_at`
) VALUES
	('desk-reset', 'The Desk Reset', 3200, 'Bundle', 'A practical refresh for clear plans and calmer desks.', 'Sage notebook · weekly pad · brass bookmark · black pencil', 'desk', 'Bestseller', 1, 0, 10, CURRENT_TIMESTAMP),
	('correspondence-set', 'The Correspondence Set', 2600, 'Bundle', 'A thoughtful edit for notes worth sending by hand.', '8 writing sheets · 8 envelopes · 4 cards · sealing stickers', 'letter', 'Gift-ready', 1, 0, 20, CURRENT_TIMESTAMP),
	('study-edit', 'The Study Edit', 2900, 'Bundle', 'A focused set for lectures, lists and deadline days.', 'Project notebook · index cards · sticky tabs · 2 pencils', 'study', 'New edit', 1, 0, 30, CURRENT_TIMESTAMP),
	('notebook', 'Layflat Notebook', 1200, 'Individual', 'A5, 160 ruled pages, sage linen cover.', '', 'notebook', '', 1, 0, 40, CURRENT_TIMESTAMP),
	('weekly-pad', 'Weekly Desk Pad', 800, 'Individual', 'Fifty tear-off sheets for a clearer week.', '', 'pad', '', 1, 0, 50, CURRENT_TIMESTAMP),
	('notecards', 'Botanical Notecards', 1000, 'Individual', 'Six cards with warm ivory envelopes.', '', 'cards', '', 1, 0, 60, CURRENT_TIMESTAMP),
	('pencils', 'Writing Pencil Pair', 400, 'Individual', 'Forest lacquer with soft graphite cores.', '', 'pencils', '', 1, 0, 70, CURRENT_TIMESTAMP),
	('tabs', 'Paper Index Tabs', 500, 'Individual', 'Four muted shades, 120 tabs in total.', '', 'tabs', '', 1, 0, 80, CURRENT_TIMESTAMP),
	('bookmark', 'Brass Page Marker', 700, 'Individual', 'A slim, reusable marker with a soft sheen.', '', 'marker', '', 1, 0, 90, CURRENT_TIMESTAMP);--> statement-breakpoint
UPDATE `order_items`
SET `product_visual` = CASE `product_id`
	WHEN 'desk-reset' THEN 'desk'
	WHEN 'correspondence-set' THEN 'letter'
	WHEN 'study-edit' THEN 'study'
	WHEN 'notebook' THEN 'notebook'
	WHEN 'weekly-pad' THEN 'pad'
	WHEN 'notecards' THEN 'cards'
	WHEN 'pencils' THEN 'pencils'
	WHEN 'tabs' THEN 'tabs'
	WHEN 'bookmark' THEN 'marker'
	ELSE `product_visual`
END;
