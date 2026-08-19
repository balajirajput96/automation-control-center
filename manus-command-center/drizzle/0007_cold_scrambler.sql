ALTER TABLE `video_jobs` ADD `sourceAssetId` int;--> statement-breakpoint
ALTER TABLE `video_jobs` ADD `thumbnailAssetId` int;--> statement-breakpoint
ALTER TABLE `video_jobs` ADD `outputAssetId` int;--> statement-breakpoint
ALTER TABLE `video_jobs` ADD `storageMetadata` json;--> statement-breakpoint
CREATE INDEX `video_jobs_source_asset_idx` ON `video_jobs` (`sourceAssetId`);--> statement-breakpoint
CREATE INDEX `video_jobs_output_asset_idx` ON `video_jobs` (`outputAssetId`);