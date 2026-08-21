CREATE TABLE `maintenance_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`maintenancePlanId` int NOT NULL,
	`ownerId` int NOT NULL,
	`taskUid` varchar(65) NOT NULL,
	`idempotencyKey` varchar(180) NOT NULL,
	`status` enum('completed','duplicate','skipped','failed') NOT NULL,
	`summary` text NOT NULL,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `maintenance_cycles_id` PRIMARY KEY(`id`),
	CONSTRAINT `maintenance_cycles_plan_key_unique` UNIQUE(`maintenancePlanId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`maxCycles` int NOT NULL DEFAULT 2400,
	`cyclesCompleted` int NOT NULL DEFAULT 0,
	`intervalMinutes` int NOT NULL DEFAULT 60,
	`scheduleCronTaskUid` varchar(65),
	`enabled` boolean NOT NULL DEFAULT true,
	`lastCycleAt` timestamp,
	`lastSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `maintenance_cycles_owner_created_idx` ON `maintenance_cycles` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `maintenance_plans_owner_enabled_idx` ON `maintenance_plans` (`ownerId`,`enabled`);--> statement-breakpoint
CREATE INDEX `maintenance_plans_task_uid_idx` ON `maintenance_plans` (`scheduleCronTaskUid`);