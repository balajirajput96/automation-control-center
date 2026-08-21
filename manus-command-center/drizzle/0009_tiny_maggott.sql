CREATE TABLE `agent_dispatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`agentId` int NOT NULL,
	`task` text NOT NULL,
	`action` enum('plan','research','generate_content','publish','deploy','delete','credential_change') NOT NULL,
	`status` enum('needs_approval','queued','approved','denied') NOT NULL,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_dispatches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `agent_dispatches_owner_status_created_idx` ON `agent_dispatches` (`ownerId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `agent_dispatches_agent_status_idx` ON `agent_dispatches` (`agentId`,`status`);