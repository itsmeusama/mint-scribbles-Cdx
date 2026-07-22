CREATE TABLE `order_status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`status` text NOT NULL,
	`changed_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_status_history_order_id_idx` ON `order_status_history` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_status_history_created_at_idx` ON `order_status_history` (`created_at`);--> statement-breakpoint
ALTER TABLE `orders` ADD `admin_notes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `updated_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `status_updated_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `orders` SET `updated_at` = `created_at`, `status_updated_at` = `created_at`;--> statement-breakpoint
INSERT INTO `order_status_history` (`order_id`, `status`, `changed_by`, `created_at`)
SELECT `id`, `status`, 'Phase 3 migration', `created_at` FROM `orders`;
