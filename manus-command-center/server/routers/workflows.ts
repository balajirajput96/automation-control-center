import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auditLogs, schedules, workflowRuns, workflows } from "../../drizzle/schema";
import { addAuditEvent, createWorkflowRunForOwner, createWorkflowTemplateForOwner, deleteScheduleForOwner, getDb, listSchedulesForOwner, listWorkflowRunsForOwner, listWorkflowTemplatesForOwner, listWorkflowsForOwner, setScheduleStateForOwner } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const nodeSchema = z.object({ id: z.string().min(1).max(100), type: z.enum(["trigger", "agent", "http", "condition", "loop", "parallel", "approval", "publish", "deploy", "storage"]), label: z.string().min(1).max(160), config: z.record(z.string(), z.unknown()).default({}) });
const edgeSchema = z.object({ id: z.string().min(1).max(100), source: z.string().min(1), target: z.string().min(1), condition: z.string().max(500).optional() });
export const workflowDefinitionSchema = z.object({ nodes: z.array(nodeSchema).min(1).max(100), edges: z.array(edgeSchema).max(300) });

function hasDirectedCycle(definition: z.infer<typeof workflowDefinitionSchema>) {
  const links = new Map<string, string[]>();
  for (const edge of definition.edges) links.set(edge.source, [...(links.get(edge.source) ?? []), edge.target]);
  const visited = new Set<string>();
  const active = new Set<string>();
  const visit = (nodeId: string): boolean => {
    if (active.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId); active.add(nodeId);
    const cyclic = (links.get(nodeId) ?? []).some(visit);
    active.delete(nodeId);
    return cyclic;
  };
  return definition.nodes.some(node => visit(node.id));
}

export function validateWorkflowDefinition(definition: z.infer<typeof workflowDefinitionSchema>) {
  const nodeIds = new Set(definition.nodes.map(node => node.id));
  const edgeIds = new Set(definition.edges.map(edge => edge.id));
  const triggerCount = definition.nodes.filter(node => node.type === "trigger").length;
  const invalidEdges = definition.edges.filter(edge => !nodeIds.has(edge.source) || !nodeIds.has(edge.target));
  const selfReferencingEdges = definition.edges.filter(edge => edge.source === edge.target);
  if (triggerCount !== 1) return { state: "invalid" as const, message: "A workflow must contain exactly one trigger node." };
  if (nodeIds.size !== definition.nodes.length) return { state: "invalid" as const, message: "Workflow node identifiers must be unique." };
  if (edgeIds.size !== definition.edges.length) return { state: "invalid" as const, message: "Workflow edge identifiers must be unique." };
  if (invalidEdges.length) return { state: "invalid" as const, message: "One or more workflow edges reference a missing node." };
  if (selfReferencingEdges.length) return { state: "invalid" as const, message: "Workflow edges cannot point to the same source and target node." };
  if (hasDirectedCycle(definition) && !definition.nodes.some(node => node.type === "loop")) return { state: "invalid" as const, message: "Cyclic workflow paths require an explicit loop node." };
  if (definition.nodes.some(node => node.type === "loop")) return { state: "warning" as const, message: "Loop nodes require an explicit runtime iteration limit before execution." };
  return { state: "valid" as const, message: "Workflow definition is structurally valid." };
}

export function isSixFieldCron(expression: string) {
  return expression.trim().split(/\s+/).length === 6;
}

export const workflowRouter = router({
  list: protectedProcedure.query(({ ctx }) => listWorkflowsForOwner(ctx.user.id)),
  runs: protectedProcedure.query(({ ctx }) => listWorkflowRunsForOwner(ctx.user.id)),
  templates: protectedProcedure.query(({ ctx }) => listWorkflowTemplatesForOwner(ctx.user.id)),
  create: protectedProcedure.input(z.object({
    name: z.string().trim().min(2).max(160),
    description: z.string().trim().max(4000).optional(),
    triggerType: z.enum(["manual", "schedule", "event", "webhook"]),
    definition: workflowDefinitionSchema,
  })).mutation(async ({ ctx, input }) => {
    const validation = validateWorkflowDefinition(input.definition);
    const db = await getDb();
    if (!db) throw new Error("Database is unavailable");
    await db.insert(workflows).values({
      ownerId: ctx.user.id,
      name: input.name,
      description: input.description ?? null,
      triggerType: input.triggerType,
      status: "draft",
      definition: input.definition,
      validationState: validation.state,
    });
    await addAuditEvent(ctx.user.id, { action: "workflow.created", resourceType: "workflow", outcome: "success", detail: `Created draft workflow ${input.name}.` });
    return { success: true, validation };
  }),
  validate: protectedProcedure.input(workflowDefinitionSchema).query(({ input }) => validateWorkflowDefinition(input)),
  saveTemplate: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), category: z.string().trim().min(2).max(100), description: z.string().trim().max(4000).optional(), definition: workflowDefinitionSchema })).mutation(async ({ ctx, input }) => {
    await createWorkflowTemplateForOwner(ctx.user.id, input);
    await addAuditEvent(ctx.user.id, { action: "workflow_template.created", resourceType: "workflow_template", outcome: "success", detail: `Saved reusable template ${input.name}.` });
    return { success: true };
  }),
  requestRun: protectedProcedure.input(z.object({ workflowId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const runId = await createWorkflowRunForOwner(ctx.user.id, input.workflowId);
    await addAuditEvent(ctx.user.id, { action: "workflow_run.requested", resourceType: "workflow_run", resourceId: String(runId ?? ""), outcome: "pending", detail: "Run was recorded as needs approval because no execution adapter is configured." });
    return { runId, status: "needs_approval" as const };
  }),
  resolveRun: protectedProcedure.input(z.object({ runId: z.number().int().positive(), decision: z.enum(["approved", "denied"]) })).mutation(async ({ ctx, input }) => {
    const runs = await listWorkflowRunsForOwner(ctx.user.id);
    const run = runs.find(item => item.id === input.runId);
    if (!run) throw new Error("Workflow run not found");
    if (run.status !== "needs_approval") throw new Error("Workflow run is not awaiting approval");
    const db = await getDb(); if (!db) throw new Error("Database is unavailable");
    const status = input.decision === "approved" ? "queued" as const : "cancelled" as const;
    await db.update(workflowRuns).set({ status }).where(eq(workflowRuns.id, input.runId));
    await addAuditEvent(ctx.user.id, { action: `workflow_run.${input.decision}`, resourceType: "workflow_run", resourceId: String(input.runId), outcome: input.decision === "approved" ? "success" : "denied", detail: input.decision === "approved" ? "Approved for an authorized execution adapter; no execution was invoked." : "Workflow run request was denied before execution." });
    return { status, execution: "not_invoked" as const };
  }),
});

export const scheduleRouter = router({
  list: protectedProcedure.query(({ ctx }) => listSchedulesForOwner(ctx.user.id)),
  preflights: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database is unavailable");
    return db.select({ scheduleId: auditLogs.resourceId, outcome: auditLogs.outcome, detail: auditLogs.detail, createdAt: auditLogs.createdAt })
      .from(auditLogs)
      .where(and(eq(auditLogs.ownerId, ctx.user.id), eq(auditLogs.action, "schedule.preflight_requested")))
      .orderBy(desc(auditLogs.createdAt)).limit(50);
  }),
  create: protectedProcedure.input(z.object({
    workflowId: z.number().int().positive(),
    name: z.string().trim().min(2).max(160),
    recurrenceType: z.enum(["once", "hourly", "daily", "weekly", "monthly", "cron", "event"]),
    cronExpression: z.string().trim().max(100).optional(),
    timezone: z.string().trim().min(1).max(64).default("UTC"),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database is unavailable");
    const matchingWorkflow = await db.select({ id: workflows.id }).from(workflows)
      .where(and(eq(workflows.id, input.workflowId), eq(workflows.ownerId, ctx.user.id))).limit(1);
    if (!matchingWorkflow[0]) throw new Error("Workflow not found");
    if (input.recurrenceType === "cron" && (!input.cronExpression || !isSixFieldCron(input.cronExpression))) {
      throw new Error("Cron schedules require a six-field UTC expression");
    }
    await db.insert(schedules).values({
      ownerId: ctx.user.id,
      workflowId: input.workflowId,
      name: input.name,
      recurrenceType: input.recurrenceType,
      cronExpression: input.cronExpression ?? null,
      timezone: input.timezone,
      status: "paused",
    });
    await addAuditEvent(ctx.user.id, { action: "schedule.created", resourceType: "schedule", outcome: "pending", detail: `Created paused ${input.recurrenceType} schedule ${input.name}; production activation is required.` });
    return { success: true, activation: "paused_until_production" as const };
  }),
  setState: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["paused", "active"]) })).mutation(async ({ ctx, input }) => {
    if (input.status === "active") return { success: false, status: "paused" as const, reason: "A deployed scheduler callback and idempotent execution handler are required before resuming this schedule." };
    await setScheduleStateForOwner(ctx.user.id, input.id, "paused");
    await addAuditEvent(ctx.user.id, { action: "schedule.paused", resourceType: "schedule", resourceId: String(input.id), outcome: "success", detail: "Schedule was paused by the owner." });
    return { success: true, status: "paused" as const };
  }),
  remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await deleteScheduleForOwner(ctx.user.id, input.id);
    await addAuditEvent(ctx.user.id, { action: "schedule.deleted", resourceType: "schedule", resourceId: String(input.id), outcome: "success", detail: "Schedule definition deleted by owner." });
    return { success: true };
  }),
  preflight: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database is unavailable");
    const schedule = await db.select({ id: schedules.id, workflowId: schedules.workflowId, status: schedules.status, recurrenceType: schedules.recurrenceType })
      .from(schedules).where(and(eq(schedules.id, input.id), eq(schedules.ownerId, ctx.user.id))).limit(1);
    if (!schedule[0]) throw new Error("Schedule not found");
    const idempotencyKey = `schedule:${schedule[0].id}:${new Date().toISOString().slice(0, 10)}`;
    await addAuditEvent(ctx.user.id, {
      action: "schedule.preflight_requested",
      resourceType: "schedule",
      resourceId: String(schedule[0].id),
      outcome: "pending",
      detail: `Execution preflight recorded with idempotency window ${idempotencyKey} for workflow ${schedule[0].workflowId} (${schedule[0].recurrenceType}, ${schedule[0].status}); no callback was invoked.`,
    });
    return {
      success: schedule[0].status === "paused",
      idempotencyKey,
      status: "needs_execution_adapter" as const,
      reason: "A signed deployed callback must atomically claim this idempotency key before any scheduled run can start.",
    };
  }),
});
