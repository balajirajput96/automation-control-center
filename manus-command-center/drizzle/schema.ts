import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "paused", "archived"]).default("active").notNull(),
  repositoryUrl: varchar("repositoryUrl", { length: 500 }),
  repositoryProvider: varchar("repositoryProvider", { length: 64 }),
  defaultBranch: varchar("defaultBranch", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("projects_owner_status_idx").on(table.ownerId, table.status)]);

export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId"),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  role: mysqlEnum("role", ["orchestrator", "coding", "research", "automation", "image", "video", "publishing", "qa", "devops", "custom"]).default("custom").notNull(),
  autonomyLevel: mysqlEnum("autonomyLevel", ["manual", "assisted", "autonomous"]).default("assisted").notNull(),
  modelPreference: varchar("modelPreference", { length: 160 }),
  instructions: text("instructions"),
  toolPolicy: json("toolPolicy"),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("agents_owner_project_idx").on(table.ownerId, table.projectId)]);

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId"),
  title: varchar("title", { length: 255 }).notNull(),
  selectedModel: varchar("selectedModel", { length: 160 }),
  provider: varchar("provider", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("conversations_owner_updated_idx").on(table.ownerId, table.updatedAt)]);

export const conversationMessages = mysqlTable("conversation_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["system", "user", "assistant", "tool"]).notNull(),
  content: text("content").notNull(),
  model: varchar("model", { length: 160 }),
  toolCalls: json("toolCalls"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("conversation_messages_conversation_created_idx").on(table.conversationId, table.createdAt)]);

export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId"),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  triggerType: mysqlEnum("triggerType", ["manual", "schedule", "event", "webhook"]).default("manual").notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "archived"]).default("draft").notNull(),
  definition: json("definition").notNull(),
  validationState: mysqlEnum("validationState", ["valid", "warning", "invalid"]).default("valid").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("workflows_owner_status_idx").on(table.ownerId, table.status)]);

export const workflowTemplates = mysqlTable("workflow_templates", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  definition: json("definition").notNull(),
  isShared: boolean("isShared").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("workflow_templates_owner_category_idx").on(table.ownerId, table.category)]);

export const workflowRuns = mysqlTable("workflow_runs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  workflowId: int("workflowId").notNull(),
  status: mysqlEnum("status", ["queued", "running", "succeeded", "failed", "cancelled", "needs_approval"]).default("queued").notNull(),
  triggerSource: varchar("triggerSource", { length: 64 }).notNull(),
  input: json("input"),
  output: json("output"),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("workflow_runs_owner_status_created_idx").on(table.ownerId, table.status, table.createdAt)]);

export const workflowRunEvents = mysqlTable("workflow_run_events", {
  id: int("id").autoincrement().primaryKey(),
  runId: int("runId").notNull(),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  message: text("message").notNull(),
  payload: json("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("workflow_run_events_run_created_idx").on(table.runId, table.createdAt)]);

export const schedules = mysqlTable("schedules", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  workflowId: int("workflowId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  recurrenceType: mysqlEnum("recurrenceType", ["once", "hourly", "daily", "weekly", "monthly", "cron", "event"]).notNull(),
  cronExpression: varchar("cronExpression", { length: 100 }),
  recurrenceConfig: json("recurrenceConfig"),
  timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  status: mysqlEnum("status", ["active", "paused", "failed", "completed"]).default("active").notNull(),
  nextExecutionAt: timestamp("nextExecutionAt"),
  lastExecutionAt: timestamp("lastExecutionAt"),
  failureCount: int("failureCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("schedules_owner_status_idx").on(table.ownerId, table.status), index("schedules_task_uid_idx").on(table.scheduleCronTaskUid)]);

export const scheduleExecutions = mysqlTable("schedule_executions", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").notNull(),
  ownerId: int("ownerId").notNull(),
  taskUid: varchar("taskUid", { length: 65 }).notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 180 }).notNull(),
  status: mysqlEnum("status", ["blocked", "skipped", "duplicate"]).notNull(),
  detail: text("detail").notNull(),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
}, table => [uniqueIndex("schedule_executions_schedule_key_unique").on(table.scheduleId, table.idempotencyKey), index("schedule_executions_owner_received_idx").on(table.ownerId, table.receivedAt)]);

export const niftyWatchDefinitions = mysqlTable("nifty_watch_definitions", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  thresholdBasisPoints: int("thresholdBasisPoints").notNull(),
  frequency: mysqlEnum("frequency", ["daily_close"]).default("daily_close").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Kolkata").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastObservedAt: timestamp("lastObservedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("nifty_watch_owner_enabled_idx").on(table.ownerId, table.enabled), index("nifty_watch_task_uid_idx").on(table.scheduleCronTaskUid)]);

export const niftyAlertDefinitions = mysqlTable("nifty_alert_definitions", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  thresholdBasisPoints: int("thresholdBasisPoints").notNull(),
  frequency: mysqlEnum("frequency", ["daily_close"]).default("daily_close").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Kolkata").notNull(),
  deliveryState: mysqlEnum("deliveryState", ["not_scheduled", "not_delivering"]).default("not_scheduled").notNull(),
  delayedDataDisclosure: boolean("delayedDataDisclosure").default(true).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("nifty_alert_owner_enabled_idx").on(table.ownerId, table.enabled)]);

export const integrations = mysqlTable("integrations", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  service: varchar("service", { length: 100 }).notNull(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  category: mysqlEnum("category", ["ai", "code", "communication", "social", "deployment", "storage", "automation"]).notNull(),
  connectionStatus: mysqlEnum("connectionStatus", ["available", "connected", "action_required", "unavailable", "error"]).default("available").notNull(),
  permissionSummary: text("permissionSummary"),
  lastHealthCheckAt: timestamp("lastHealthCheckAt"),
  lastSuccessAt: timestamp("lastSuccessAt"),
  lastError: text("lastError"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("integrations_owner_service_idx").on(table.ownerId, table.service), uniqueIndex("integrations_owner_service_unique").on(table.ownerId, table.service)]);

export const contentProjects = mysqlTable("content_projects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId"),
  title: varchar("title", { length: 255 }).notNull(),
  stage: mysqlEnum("stage", ["research", "outline", "script", "storyboard", "production", "review", "exported"]).default("research").notNull(),
  brief: text("brief"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("content_projects_owner_stage_idx").on(table.ownerId, table.stage)]);

export const contentSources = mysqlTable("content_sources", {
  id: int("id").autoincrement().primaryKey(),
  contentProjectId: int("contentProjectId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  url: varchar("url", { length: 2000 }).notNull(),
  sourceType: varchar("sourceType", { length: 80 }).notNull(),
  credibility: mysqlEnum("credibility", ["established", "emerging", "opinion", "hypothesis", "unreviewed"]).default("unreviewed").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("content_sources_project_idx").on(table.contentProjectId)]);

export const contentCitations = mysqlTable("content_citations", {
  id: int("id").autoincrement().primaryKey(),
  contentProjectId: int("contentProjectId").notNull(),
  sourceId: int("sourceId"),
  section: mysqlEnum("section", ["outline", "script", "storyboard", "export_notes"]).notNull(),
  locator: varchar("locator", { length: 500 }),
  claim: text("claim").notNull(),
  citationText: text("citationText").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("content_citations_project_idx").on(table.contentProjectId), index("content_citations_source_idx").on(table.sourceId)]);

export const contentExports = mysqlTable("content_exports", {
  id: int("id").autoincrement().primaryKey(),
  contentProjectId: int("contentProjectId").notNull(),
  assetId: int("assetId"),
  format: varchar("format", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["planned", "ready", "exported", "failed"]).default("planned").notNull(),
  destination: varchar("destination", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("content_exports_project_idx").on(table.contentProjectId), index("content_exports_asset_idx").on(table.assetId)]);

export const mediaAssets = mysqlTable("media_assets", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  contentProjectId: int("contentProjectId"),
  kind: mysqlEnum("kind", ["image", "audio", "video", "thumbnail", "document", "other"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 1000 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 2000 }).notNull(),
  mimeType: varchar("mimeType", { length: 160 }),
  bytes: int("bytes"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("media_assets_owner_kind_idx").on(table.ownerId, table.kind)]);

export const videoJobs = mysqlTable("video_jobs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  contentProjectId: int("contentProjectId"),
  title: varchar("title", { length: 255 }).notNull(),
  outputFormat: mysqlEnum("outputFormat", ["vertical_9_16", "landscape_16_9", "square_1_1"]).default("vertical_9_16").notNull(),
  targetDurationSeconds: int("targetDurationSeconds").default(60).notNull(),
  status: mysqlEnum("status", ["draft", "queued", "processing", "needs_review", "exported", "failed"]).default("draft").notNull(),
  editPlan: json("editPlan"),
  sourceAssetId: int("sourceAssetId"),
  thumbnailAssetId: int("thumbnailAssetId"),
  outputAssetId: int("outputAssetId"),
  storageMetadata: json("storageMetadata"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("video_jobs_owner_status_idx").on(table.ownerId, table.status), index("video_jobs_source_asset_idx").on(table.sourceAssetId), index("video_jobs_output_asset_idx").on(table.outputAssetId)]);

export const githubRepositories = mysqlTable("github_repositories", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId"),
  providerRepositoryId: varchar("providerRepositoryId", { length: 100 }),
  fullName: varchar("fullName", { length: 500 }).notNull(),
  defaultBranch: varchar("defaultBranch", { length: 255 }),
  visibility: mysqlEnum("visibility", ["public", "private", "internal", "unknown"]).default("unknown").notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("github_repositories_owner_project_idx").on(table.ownerId, table.projectId)]);

export const deploymentTargets = mysqlTable("deployment_targets", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId"),
  provider: mysqlEnum("provider", ["github", "vercel", "cloudflare", "google_cloud", "other"]).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["unknown", "healthy", "degraded", "failed", "not_connected"]).default("not_connected").notNull(),
  environment: varchar("environment", { length: 80 }),
  endpointUrl: varchar("endpointUrl", { length: 2000 }),
  lastHealthCheckAt: timestamp("lastHealthCheckAt"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("deployment_targets_owner_provider_idx").on(table.ownerId, table.provider), uniqueIndex("deployment_targets_owner_provider_unique").on(table.ownerId, table.provider)]);

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId"),
  action: varchar("action", { length: 160 }).notNull(),
  resourceType: varchar("resourceType", { length: 100 }).notNull(),
  resourceId: varchar("resourceId", { length: 100 }),
  outcome: mysqlEnum("outcome", ["success", "failure", "pending", "denied"]).notNull(),
  detail: text("detail"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("audit_logs_owner_created_idx").on(table.ownerId, table.createdAt)]);

export type Project = typeof projects.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type ContentProject = typeof contentProjects.$inferSelect;
export type VideoJob = typeof videoJobs.$inferSelect;
