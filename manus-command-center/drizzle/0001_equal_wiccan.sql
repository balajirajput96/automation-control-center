CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`name` varchar(160) NOT NULL,
	`description` text,
	`role` enum('orchestrator','coding','research','automation','image','video','publishing','qa','devops','custom') NOT NULL DEFAULT 'custom',
	`autonomyLevel` enum('manual','assisted','autonomous') NOT NULL DEFAULT 'assisted',
	`modelPreference` varchar(160),
	`instructions` text,
	`toolPolicy` json,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`action` varchar(160) NOT NULL,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` varchar(100),
	`outcome` enum('success','failure','pending','denied') NOT NULL,
	`detail` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`title` varchar(255) NOT NULL,
	`stage` enum('research','outline','script','storyboard','production','review','exported') NOT NULL DEFAULT 'research',
	`brief` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentProjectId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`url` varchar(2000) NOT NULL,
	`sourceType` varchar(80) NOT NULL,
	`credibility` enum('established','emerging','opinion','hypothesis','unreviewed') NOT NULL DEFAULT 'unreviewed',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('system','user','assistant','tool') NOT NULL,
	`content` text NOT NULL,
	`model` varchar(160),
	`toolCalls` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`title` varchar(255) NOT NULL,
	`selectedModel` varchar(160),
	`provider` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deployment_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`provider` enum('github','vercel','cloudflare','google_cloud','other') NOT NULL,
	`name` varchar(160) NOT NULL,
	`status` enum('unknown','healthy','degraded','failed','not_connected') NOT NULL DEFAULT 'not_connected',
	`environment` varchar(80),
	`endpointUrl` varchar(2000),
	`lastHealthCheckAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deployment_targets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `github_repositories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`providerRepositoryId` varchar(100),
	`fullName` varchar(500) NOT NULL,
	`defaultBranch` varchar(255),
	`visibility` enum('public','private','internal','unknown') NOT NULL DEFAULT 'unknown',
	`lastSyncedAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `github_repositories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`service` varchar(100) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`category` enum('ai','code','communication','social','deployment','storage','automation') NOT NULL,
	`connectionStatus` enum('available','connected','action_required','unavailable','error') NOT NULL DEFAULT 'available',
	`permissionSummary` text,
	`lastHealthCheckAt` timestamp,
	`lastSuccessAt` timestamp,
	`lastError` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`contentProjectId` int,
	`kind` enum('image','audio','video','thumbnail','document','other') NOT NULL,
	`name` varchar(255) NOT NULL,
	`storageKey` varchar(1000) NOT NULL,
	`storageUrl` varchar(2000) NOT NULL,
	`mimeType` varchar(160),
	`bytes` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`status` enum('active','paused','archived') NOT NULL DEFAULT 'active',
	`repositoryUrl` varchar(500),
	`repositoryProvider` varchar(64),
	`defaultBranch` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`workflowId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`recurrenceType` enum('once','hourly','daily','weekly','monthly','cron','event') NOT NULL,
	`cronExpression` varchar(100),
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`scheduleCronTaskUid` varchar(65),
	`status` enum('active','paused','failed','completed') NOT NULL DEFAULT 'active',
	`nextExecutionAt` timestamp,
	`lastExecutionAt` timestamp,
	`failureCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`contentProjectId` int,
	`title` varchar(255) NOT NULL,
	`outputFormat` enum('vertical_9_16','landscape_16_9','square_1_1') NOT NULL DEFAULT 'vertical_9_16',
	`targetDurationSeconds` int NOT NULL DEFAULT 60,
	`status` enum('draft','queued','processing','needs_review','exported','failed') NOT NULL DEFAULT 'draft',
	`editPlan` json,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_run_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`message` text NOT NULL,
	`payload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_run_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`workflowId` int NOT NULL,
	`status` enum('queued','running','succeeded','failed','cancelled','needs_approval') NOT NULL DEFAULT 'queued',
	`triggerSource` varchar(64) NOT NULL,
	`input` json,
	`output` json,
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`definition` json NOT NULL,
	`isShared` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflow_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`name` varchar(160) NOT NULL,
	`description` text,
	`triggerType` enum('manual','schedule','event','webhook') NOT NULL DEFAULT 'manual',
	`status` enum('draft','active','paused','archived') NOT NULL DEFAULT 'draft',
	`definition` json NOT NULL,
	`validationState` enum('valid','warning','invalid') NOT NULL DEFAULT 'valid',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `agents_owner_project_idx` ON `agents` (`ownerId`,`projectId`);--> statement-breakpoint
CREATE INDEX `audit_logs_owner_created_idx` ON `audit_logs` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `content_projects_owner_stage_idx` ON `content_projects` (`ownerId`,`stage`);--> statement-breakpoint
CREATE INDEX `content_sources_project_idx` ON `content_sources` (`contentProjectId`);--> statement-breakpoint
CREATE INDEX `conversation_messages_conversation_created_idx` ON `conversation_messages` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `conversations_owner_updated_idx` ON `conversations` (`ownerId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `deployment_targets_owner_provider_idx` ON `deployment_targets` (`ownerId`,`provider`);--> statement-breakpoint
CREATE INDEX `github_repositories_owner_project_idx` ON `github_repositories` (`ownerId`,`projectId`);--> statement-breakpoint
CREATE INDEX `integrations_owner_service_idx` ON `integrations` (`ownerId`,`service`);--> statement-breakpoint
CREATE INDEX `media_assets_owner_kind_idx` ON `media_assets` (`ownerId`,`kind`);--> statement-breakpoint
CREATE INDEX `projects_owner_status_idx` ON `projects` (`ownerId`,`status`);--> statement-breakpoint
CREATE INDEX `schedules_owner_status_idx` ON `schedules` (`ownerId`,`status`);--> statement-breakpoint
CREATE INDEX `schedules_task_uid_idx` ON `schedules` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `video_jobs_owner_status_idx` ON `video_jobs` (`ownerId`,`status`);--> statement-breakpoint
CREATE INDEX `workflow_run_events_run_created_idx` ON `workflow_run_events` (`runId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `workflow_runs_owner_status_created_idx` ON `workflow_runs` (`ownerId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `workflow_templates_owner_category_idx` ON `workflow_templates` (`ownerId`,`category`);--> statement-breakpoint
CREATE INDEX `workflows_owner_status_idx` ON `workflows` (`ownerId`,`status`);