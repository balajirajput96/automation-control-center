import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  agents,
  auditLogs,
  contentProjects,
  contentSources,
  conversations,
  conversationMessages,
  InsertUser,
  projects,
  mediaAssets,
  deploymentTargets,
  integrations,
  schedules,
  users,
  workflowRunEvents,
  workflowRuns,
  workflowTemplates,
  workflows,
  videoJobs,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db;
}

export async function getCommandCenterSnapshot(ownerId: number) {
  const db = await requireDb();
  const [projectRows, agentRows, runningRows, scheduleRows, recentRuns, recentAudits, deploymentRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(projects).where(eq(projects.ownerId, ownerId)),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(agents).where(and(eq(agents.ownerId, ownerId), eq(agents.enabled, true))),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(workflowRuns).where(and(eq(workflowRuns.ownerId, ownerId), eq(workflowRuns.status, "running"))),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schedules).where(and(eq(schedules.ownerId, ownerId), eq(schedules.status, "active"))),
    db.select().from(workflowRuns).where(eq(workflowRuns.ownerId, ownerId)).orderBy(desc(workflowRuns.createdAt)).limit(8),
    db.select().from(auditLogs).where(eq(auditLogs.ownerId, ownerId)).orderBy(desc(auditLogs.createdAt)).limit(8),
    db.select({ status: deploymentTargets.status, count: sql<number>`count(*)`.mapWith(Number) }).from(deploymentTargets).where(eq(deploymentTargets.ownerId, ownerId)).groupBy(deploymentTargets.status),
  ]);

  return {
    metrics: {
      projects: projectRows[0]?.count ?? 0,
      activeAgents: agentRows[0]?.count ?? 0,
      runningWorkflows: runningRows[0]?.count ?? 0,
      activeSchedules: scheduleRows[0]?.count ?? 0,
    },
    recentRuns,
    recentAudits,
    recentAgentActivity: recentAudits.filter(event => event.resourceType === "agent"),
    deployments: deploymentRows,
  };
}

export async function listProjectsForOwner(ownerId: number) {
  const db = await requireDb();
  return db.select().from(projects).where(eq(projects.ownerId, ownerId)).orderBy(desc(projects.updatedAt));
}

export async function createProjectForOwner(ownerId: number, values: {
  name: string;
  description?: string | null;
  repositoryUrl?: string | null;
}) {
  const db = await requireDb();
  const inserted = await db.insert(projects).values({
    ownerId,
    name: values.name,
    description: values.description ?? null,
    repositoryUrl: values.repositoryUrl ?? null,
    repositoryProvider: values.repositoryUrl ? "github" : null,
  }).$returningId();
  return inserted[0]?.id;
}

export async function updateProjectForOwner(ownerId: number, projectId: number, values: { name: string; description?: string | null; repositoryUrl?: string | null; status: "active" | "paused" | "archived" }) {
  const db = await requireDb();
  const found = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId))).limit(1);
  if (!found[0]) throw new Error("Project not found");
  await db.update(projects).set({ ...values, repositoryProvider: values.repositoryUrl ? "github" : null }).where(eq(projects.id, projectId));
}

export async function deleteProjectForOwner(ownerId: number, projectId: number) {
  const db = await requireDb();
  const found = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId))).limit(1);
  if (!found[0]) throw new Error("Project not found");
  await db.delete(projects).where(eq(projects.id, projectId));
}

export async function listAgentsForOwner(ownerId: number) {
  const db = await requireDb();
  return db.select().from(agents).where(eq(agents.ownerId, ownerId)).orderBy(desc(agents.updatedAt));
}

export async function createAgentForOwner(ownerId: number, values: {
  name: string;
  description?: string | null;
  role: "orchestrator" | "coding" | "research" | "automation" | "image" | "video" | "publishing" | "qa" | "devops" | "custom";
  autonomyLevel: "manual" | "assisted" | "autonomous";
  modelPreference?: string | null;
  instructions?: string | null;
}) {
  const db = await requireDb();
  await db.insert(agents).values({ ownerId, ...values, enabled: true });
}

export async function updateAgentForOwner(ownerId: number, agentId: number, values: { name: string; description?: string | null; role: "orchestrator" | "coding" | "research" | "automation" | "image" | "video" | "publishing" | "qa" | "devops" | "custom"; autonomyLevel: "manual" | "assisted" | "autonomous"; modelPreference?: string | null; instructions?: string | null; enabled: boolean; toolPolicy: unknown }) {
  const db = await requireDb();
  const found = await db.select({ id: agents.id }).from(agents).where(and(eq(agents.id, agentId), eq(agents.ownerId, ownerId))).limit(1);
  if (!found[0]) throw new Error("Agent not found");
  await db.update(agents).set(values).where(eq(agents.id, agentId));
}

export async function listWorkflowsForOwner(ownerId: number) {
  const db = await requireDb();
  return db.select().from(workflows).where(eq(workflows.ownerId, ownerId)).orderBy(desc(workflows.updatedAt));
}

export async function listWorkflowTemplatesForOwner(ownerId: number) {
  const db = await requireDb();
  return db.select().from(workflowTemplates).where(eq(workflowTemplates.ownerId, ownerId)).orderBy(desc(workflowTemplates.updatedAt));
}

export async function createWorkflowTemplateForOwner(ownerId: number, values: { name: string; category: string; description?: string | null; definition: unknown }) {
  const db = await requireDb();
  await db.insert(workflowTemplates).values({ ownerId, ...values, isShared: false });
}

export async function createWorkflowRunForOwner(ownerId: number, workflowId: number) {
  const db = await requireDb();
  const workflow = await db.select({ id: workflows.id, name: workflows.name }).from(workflows).where(and(eq(workflows.id, workflowId), eq(workflows.ownerId, ownerId))).limit(1);
  if (!workflow[0]) throw new Error("Workflow not found");
  const inserted = await db.insert(workflowRuns).values({ ownerId, workflowId, status: "needs_approval", triggerSource: "manual" }).$returningId();
  const runId = inserted[0]?.id;
  if (runId) await db.insert(workflowRunEvents).values({ runId, eventType: "approval_required", message: `Manual run for ${workflow[0].name} is awaiting an approved execution adapter.` });
  return runId;
}

export async function listSchedulesForOwner(ownerId: number) {
  const db = await requireDb();
  return db.select().from(schedules).where(eq(schedules.ownerId, ownerId)).orderBy(desc(schedules.updatedAt));
}

export async function setScheduleStateForOwner(ownerId: number, scheduleId: number, status: "paused" | "active") {
  const db = await requireDb();
  const schedule = await db.select({ id: schedules.id }).from(schedules).where(and(eq(schedules.id, scheduleId), eq(schedules.ownerId, ownerId))).limit(1);
  if (!schedule[0]) throw new Error("Schedule not found");
  await db.update(schedules).set({ status }).where(eq(schedules.id, scheduleId));
}

export async function listConversationsForOwner(ownerId: number) {
  const db = await requireDb();
  return db.select().from(conversations).where(eq(conversations.ownerId, ownerId)).orderBy(desc(conversations.updatedAt));
}

export async function getConversationWithMessages(ownerId: number, conversationId: number) {
  const db = await requireDb();
  const conversation = await db.select().from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.ownerId, ownerId))).limit(1);
  if (!conversation[0]) return undefined;
  const messages = await db.select().from(conversationMessages)
    .where(eq(conversationMessages.conversationId, conversationId)).orderBy(conversationMessages.createdAt);
  return { conversation: conversation[0], messages };
}

export async function createConversationForOwner(ownerId: number, values: { title: string; selectedModel?: string | null; provider?: string | null }) {
  const db = await requireDb();
  const inserted = await db.insert(conversations).values({ ownerId, ...values }).$returningId();
  return inserted[0]?.id;
}

export async function addConversationMessage(conversationId: number, values: {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  model?: string | null;
}) {
  const db = await requireDb();
  await db.insert(conversationMessages).values({ conversationId, ...values });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
}

export async function addAuditEvent(ownerId: number, values: {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  outcome: "success" | "failure" | "pending" | "denied";
  detail?: string | null;
}) {
  const db = await requireDb();
  await db.insert(auditLogs).values({ ownerId, ...values });
}

export async function searchAuditEventsForOwner(ownerId: number, query?: string) {
  const db = await requireDb();
  const needle = query?.trim();
  const condition = needle ? and(eq(auditLogs.ownerId, ownerId), or(like(auditLogs.action, `%${needle}%`), like(auditLogs.resourceType, `%${needle}%`), like(auditLogs.detail, `%${needle}%`))) : eq(auditLogs.ownerId, ownerId);
  return db.select().from(auditLogs).where(condition).orderBy(desc(auditLogs.createdAt)).limit(100);
}

export async function listContentProjectsForOwner(ownerId: number) {
  const db = await requireDb();
  return db.select().from(contentProjects).where(eq(contentProjects.ownerId, ownerId)).orderBy(desc(contentProjects.updatedAt));
}

export async function createContentProjectForOwner(ownerId: number, values: { title: string; brief?: string | null }) {
  const db = await requireDb();
  const inserted = await db.insert(contentProjects).values({ ownerId, title: values.title, brief: values.brief ?? null }).$returningId();
  return inserted[0]?.id;
}

export async function listContentSourcesForOwner(ownerId: number, contentProjectId: number) {
  const db = await requireDb();
  const owned = await db.select({ id: contentProjects.id }).from(contentProjects).where(and(eq(contentProjects.id, contentProjectId), eq(contentProjects.ownerId, ownerId))).limit(1);
  if (!owned[0]) throw new Error("Content project not found");
  return db.select().from(contentSources).where(eq(contentSources.contentProjectId, contentProjectId)).orderBy(desc(contentSources.createdAt));
}

export async function addContentSourceForOwner(ownerId: number, values: { contentProjectId: number; title: string; url: string; sourceType: string; credibility: "established" | "emerging" | "opinion" | "hypothesis" | "unreviewed"; notes?: string | null }) {
  const db = await requireDb();
  const owned = await db.select({ id: contentProjects.id }).from(contentProjects).where(and(eq(contentProjects.id, values.contentProjectId), eq(contentProjects.ownerId, ownerId))).limit(1);
  if (!owned[0]) throw new Error("Content project not found");
  await db.insert(contentSources).values(values);
}

export async function listMediaAssetsForOwner(ownerId: number) {
  const db = await requireDb();
  return db.select().from(mediaAssets).where(eq(mediaAssets.ownerId, ownerId)).orderBy(desc(mediaAssets.createdAt));
}

export async function addMediaAssetForOwner(ownerId: number, values: { contentProjectId?: number | null; kind: "image" | "audio" | "video" | "thumbnail" | "document" | "other"; name: string; storageKey: string; storageUrl: string; mimeType?: string | null; metadata?: unknown }) {
  const db = await requireDb();
  await db.insert(mediaAssets).values({ ownerId, ...values });
}

export async function listVideoJobsForOwner(ownerId: number) {
  const db = await requireDb();
  return db.select().from(videoJobs).where(eq(videoJobs.ownerId, ownerId)).orderBy(desc(videoJobs.updatedAt));
}

export async function createVideoJobForOwner(ownerId: number, values: { title: string; outputFormat: "vertical_9_16" | "landscape_16_9" | "square_1_1"; targetDurationSeconds: number; contentProjectId?: number | null; editPlan?: unknown }) {
  const db = await requireDb();
  await db.insert(videoJobs).values({ ownerId, ...values, status: "draft" });
}

const integrationDefaults = [
  { service: "model_catalog", displayName: "Multi-model AI", category: "ai" as const, connectionStatus: "available" as const, permissionSummary: "Built-in server-side model catalog and inference." },
  { service: "image_generation", displayName: "Visual Asset Generation", category: "ai" as const, connectionStatus: "available" as const, permissionSummary: "Built-in server-side image generation." },
  { service: "media_storage", displayName: "Managed Media Storage", category: "storage" as const, connectionStatus: "available" as const, permissionSummary: "Managed object storage for media assets." },
  { service: "github", displayName: "GitHub", category: "code" as const, connectionStatus: "action_required" as const, permissionSummary: "Requires application-authorized GitHub credential." },
  { service: "gmail", displayName: "Gmail", category: "communication" as const, connectionStatus: "action_required" as const, permissionSummary: "Requires application-authorized Gmail connection." },
  { service: "instagram", displayName: "Instagram", category: "social" as const, connectionStatus: "action_required" as const, permissionSummary: "Requires official publishing API authorization." },
  { service: "vercel", displayName: "Vercel", category: "deployment" as const, connectionStatus: "action_required" as const, permissionSummary: "Requires Vercel API credential and project mapping." },
  { service: "cloudflare", displayName: "Cloudflare", category: "deployment" as const, connectionStatus: "action_required" as const, permissionSummary: "Requires Cloudflare API credential and zone mapping." },
  { service: "google_cloud", displayName: "Google Cloud", category: "deployment" as const, connectionStatus: "action_required" as const, permissionSummary: "Requires Google Cloud service credential and deployment target." },
];

export async function ensureIntegrationRegistry(ownerId: number) {
  const db = await requireDb();
  const existing = await db.select({ service: integrations.service }).from(integrations).where(eq(integrations.ownerId, ownerId));
  const known = new Set(existing.map(item => item.service));
  const missing = integrationDefaults.filter(item => !known.has(item.service));
  if (missing.length) await db.insert(integrations).values(missing.map(item => ({ ownerId, ...item }))).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  const targetRows = await db.select({ provider: deploymentTargets.provider }).from(deploymentTargets).where(eq(deploymentTargets.ownerId, ownerId));
  const targetProviders = new Set(targetRows.map(item => item.provider));
  const targets = [
    { provider: "github" as const, name: "GitHub source control" },
    { provider: "vercel" as const, name: "Vercel production" },
    { provider: "cloudflare" as const, name: "Cloudflare edge" },
    { provider: "google_cloud" as const, name: "Google Cloud runtime" },
  ].filter(item => !targetProviders.has(item.provider));
  if (targets.length) await db.insert(deploymentTargets).values(targets.map(item => ({ ownerId, ...item, status: "not_connected" as const }))).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
}

export async function listIntegrationsForOwner(ownerId: number) {
  const db = await requireDb();
  await ensureIntegrationRegistry(ownerId);
  return db.select().from(integrations).where(eq(integrations.ownerId, ownerId)).orderBy(integrations.category, integrations.displayName);
}

export async function listDeploymentTargetsForOwner(ownerId: number) {
  const db = await requireDb();
  await ensureIntegrationRegistry(ownerId);
  return db.select().from(deploymentTargets).where(eq(deploymentTargets.ownerId, ownerId)).orderBy(deploymentTargets.provider);
}

export async function updateIntegrationHealth(ownerId: number, service: string, values: { connectionStatus: "available" | "connected" | "action_required" | "unavailable" | "error"; lastError?: string | null; permissionSummary?: string | null }) {
  const db = await requireDb();
  await db.update(integrations).set({ ...values, lastHealthCheckAt: new Date(), lastSuccessAt: values.connectionStatus === "connected" || values.connectionStatus === "available" ? new Date() : undefined }).where(and(eq(integrations.ownerId, ownerId), eq(integrations.service, service)));
}
