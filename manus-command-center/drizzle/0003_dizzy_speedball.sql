CREATE TABLE `nifty_watch_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`thresholdBasisPoints` int NOT NULL,
	`frequency` enum('daily_close') NOT NULL DEFAULT 'daily_close',
	`timezone` varchar(64) NOT NULL DEFAULT 'Asia/Kolkata',
	`enabled` boolean NOT NULL DEFAULT true,
	`scheduleCronTaskUid` varchar(65),
	`lastObservedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nifty_watch_definitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `nifty_watch_owner_enabled_idx` ON `nifty_watch_definitions` (`ownerId`,`enabled`);--> statement-breakpoint
CREATE INDEX `nifty_watch_task_uid_idx` ON `nifty_watch_definitions` (`scheduleCronTaskUid`);