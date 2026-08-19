CREATE TABLE `content_citations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentProjectId` int NOT NULL,
	`sourceId` int,
	`section` enum('outline','script','storyboard','export_notes') NOT NULL,
	`locator` varchar(500),
	`claim` text NOT NULL,
	`citationText` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_citations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentProjectId` int NOT NULL,
	`assetId` int,
	`format` varchar(100) NOT NULL,
	`status` enum('planned','ready','exported','failed') NOT NULL DEFAULT 'planned',
	`destination` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_exports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `content_citations_project_idx` ON `content_citations` (`contentProjectId`);--> statement-breakpoint
CREATE INDEX `content_citations_source_idx` ON `content_citations` (`sourceId`);--> statement-breakpoint
CREATE INDEX `content_exports_project_idx` ON `content_exports` (`contentProjectId`);--> statement-breakpoint
CREATE INDEX `content_exports_asset_idx` ON `content_exports` (`assetId`);