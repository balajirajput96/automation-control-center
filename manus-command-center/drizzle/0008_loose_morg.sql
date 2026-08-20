CREATE TABLE `schedule_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int NOT NULL,
	`ownerId` int NOT NULL,
	`taskUid` varchar(65) NOT NULL,
	`idempotencyKey` varchar(180) NOT NULL,
	`status` enum('blocked','skipped','duplicate') NOT NULL,
	`detail` text NOT NULL,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schedule_executions_id` PRIMARY KEY(`id`),
	CONSTRAINT `schedule_executions_schedule_key_unique` UNIQUE(`scheduleId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE INDEX `schedule_executions_owner_received_idx` ON `schedule_executions` (`ownerId`,`receivedAt`);