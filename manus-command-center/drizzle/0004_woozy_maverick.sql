CREATE TABLE `nifty_alert_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`thresholdBasisPoints` int NOT NULL,
	`frequency` enum('daily_close') NOT NULL DEFAULT 'daily_close',
	`timezone` varchar(64) NOT NULL DEFAULT 'Asia/Kolkata',
	`deliveryState` enum('not_scheduled','not_delivering') NOT NULL DEFAULT 'not_scheduled',
	`delayedDataDisclosure` boolean NOT NULL DEFAULT true,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nifty_alert_definitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `nifty_alert_owner_enabled_idx` ON `nifty_alert_definitions` (`ownerId`,`enabled`);