import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { schedules, workflows } from "../../drizzle/schema";
import { addAuditEvent, createWorkflowRunForOwner, createWorkflowTemplateForOwner, getDb, listSchedulesForOwner, listWorkflowTemplatesForOwner, listWorkflowsForOwner, setScheduleStateForOwner } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const nodeSchema = z.object({ id: z.string().min(1).max(100), type: z.enum(["trigger", "agent", "http", "condition", "loop", "parallel", "approval", "publish", "deploy", "storage"]), label: z.string().min(1).max(160), config: z.record(z.string(), z.unknown()).default({}) });
const edgeSchema = z.object({ id: z.string().min(1).max(100), source: z.string().min(1), target: z.string().min(1), condition: z.string().max(500).optional() });
export const workflowDefinitionSchema = z.object({ nodes: z.array(nodeSchema).min(1).max(100), edges: z.array(edgeSchema).max(300) });

export function validateWorkflowDefinition(definition: z.infer<typeof workflowDefinitionSchema>) {
  const nodeIds = new Set(definition.nodes.map(node => node.id));
  const triggerCount = definition.nodes.filter(node => node.type === "trigger").length;
  const invalidEdges = definition.edges.filter(edge => !nodeIds.has(edge.source) || !nodeIds.has(edge.target));
  if (triggerCount !== 1) return { state: "invalid" as const, message: "A workflow must contain exactly one trigger node." };
  if (invalidEdges.length) return { state: "invalid" as const, message: "One or more workflow edges reference a missing node." };
  if (definition.nodes.some(node => node.type === "loop")) return { state: "warning" as const, message: "Loop nodes require an explicit runtime iteration limit before execution." };
  return { state: "valid" as const, message: "Workflow definition is structurally valid." };
}

export function isSixFieldCron(expression: string) {
  return expression.trim().split(/\s+/).length === 6;
}

export const workflowRouter = router({
  list: protectedProcedure.query(({ ctx }) => listWorkflowsForOwner(ctx.user.id)),
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
});

export const scheduleRouter = router({
  list: protectedProcedure.query(({ ctx }) => listSchedulesForOwner(ctx.user.id)),
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
});
