import { z } from "zod";
import { addAuditEvent, createAgentDispatchForOwner, createAgentForOwner, createProjectForOwner, deleteProjectForOwner, listAgentDispatchesForOwner, listAgentsForOwner, listProjectAuditEventsForOwner, listProjectsForOwner, resolveAgentDispatchForOwner, updateAgentForOwner, updateProjectForOwner } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { evaluateExecutionPolicy } from "../policy";

const agentRoles = ["orchestrator", "coding", "research", "automation", "image", "video", "publishing", "qa", "devops", "custom"] as const;
const autonomyLevels = ["manual", "assisted", "autonomous"] as const;

export const projectRouter = router({
  list: protectedProcedure.query(({ ctx }) => listProjectsForOwner(ctx.user.id)),
  activity: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => listProjectAuditEventsForOwner(ctx.user.id, input.id)),
  create: protectedProcedure.input(z.object({
    name: z.string().trim().min(2).max(160),
    description: z.string().trim().max(4000).optional(),
    repositoryUrl: z.string().url().optional().or(z.literal("")),
  })).mutation(async ({ ctx, input }) => {
    const projectId = await createProjectForOwner(ctx.user.id, {
      name: input.name,
      description: input.description,
      repositoryUrl: input.repositoryUrl || null,
    });
    await addAuditEvent(ctx.user.id, { action: "project.created", resourceType: "project", resourceId: String(projectId ?? ""), outcome: "success", detail: `Created project ${input.name}.` });
    return { success: true };
  }),
  update: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(160), description: z.string().trim().max(4000).optional(), repositoryUrl: z.string().url().optional().or(z.literal("")), status: z.enum(["active", "paused", "archived"]) })).mutation(async ({ ctx, input }) => {
    await updateProjectForOwner(ctx.user.id, input.id, { ...input, description: input.description ?? null, repositoryUrl: input.repositoryUrl || null });
    await addAuditEvent(ctx.user.id, { action: "project.updated", resourceType: "project", resourceId: String(input.id), outcome: "success", detail: `Updated project ${input.name}.` });
    return { success: true };
  }),
  remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await deleteProjectForOwner(ctx.user.id, input.id);
    await addAuditEvent(ctx.user.id, { action: "project.deleted", resourceType: "project", resourceId: String(input.id), outcome: "success", detail: "Deleted project." });
    return { success: true };
  }),
});

export const agentRouter = router({
  list: protectedProcedure.query(({ ctx }) => listAgentsForOwner(ctx.user.id)),
  dispatches: protectedProcedure.input(z.object({ agentId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => listAgentDispatchesForOwner(ctx.user.id, input?.agentId)),
  create: protectedProcedure.input(z.object({
    name: z.string().trim().min(2).max(160),
    description: z.string().trim().max(4000).optional(),
    role: z.enum(agentRoles),
    autonomyLevel: z.enum(autonomyLevels),
    modelPreference: z.string().trim().max(160).optional(),
    instructions: z.string().trim().max(12000).optional(),
    toolPolicy: z.record(z.string(), z.unknown()).default({}),
  })).mutation(async ({ ctx, input }) => {
    await createAgentForOwner(ctx.user.id, input);
    await addAuditEvent(ctx.user.id, { action: "agent.created", resourceType: "agent", outcome: "success", detail: `Created ${input.autonomyLevel} ${input.role} agent ${input.name}.` });
    return { success: true };
  }),
  update: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(160), description: z.string().trim().max(4000).optional(), role: z.enum(agentRoles), autonomyLevel: z.enum(autonomyLevels), modelPreference: z.string().trim().max(160).optional(), instructions: z.string().trim().max(12000).optional(), enabled: z.boolean(), toolPolicy: z.record(z.string(), z.unknown()).default({} ) })).mutation(async ({ ctx, input }) => {
    await updateAgentForOwner(ctx.user.id, input.id, { ...input, description: input.description ?? null, modelPreference: input.modelPreference ?? null, instructions: input.instructions ?? null });
    await addAuditEvent(ctx.user.id, { action: "agent.updated", resourceType: "agent", resourceId: String(input.id), outcome: "success", detail: `Updated ${input.autonomyLevel} policy for ${input.name}.` });
    return { success: true };
  }),
  evaluateAction: protectedProcedure.input(z.object({ agentId: z.number().int().positive(), action: z.enum(["plan", "research", "generate_content", "publish", "deploy", "delete", "credential_change"]) })).query(async ({ ctx, input }) => {
    const agents = await listAgentsForOwner(ctx.user.id);
    const agent = agents.find(item => item.id === input.agentId);
    if (!agent) throw new Error("Agent not found");
    return evaluateExecutionPolicy(agent.autonomyLevel, input.action);
  }),
  requestDispatch: protectedProcedure.input(z.object({ agentId: z.number().int().positive(), task: z.string().trim().min(3).max(2000), action: z.enum(["plan", "research", "generate_content", "publish", "deploy", "delete", "credential_change"]) })).mutation(async ({ ctx, input }) => {
    const agents = await listAgentsForOwner(ctx.user.id); const agent = agents.find(item => item.id === input.agentId);
    if (!agent) throw new Error("Agent not found");
    const policy = evaluateExecutionPolicy(agent.autonomyLevel, input.action);
    const outcome = policy.decision === "allowed" ? "success" as const : "pending" as const;
    const status = outcome === "success" ? "queued" as const : "needs_approval" as const;
    const dispatchId = await createAgentDispatchForOwner(ctx.user.id, { agentId: agent.id, task: input.task, action: input.action, status });
    await addAuditEvent(ctx.user.id, { action: "agent_dispatch.requested", resourceType: "agent", resourceId: String(agent.id), outcome, detail: `${agent.name}: ${input.task}`, metadata: { dispatchId, action: input.action } });
    return { status, policy, dispatchId };
  }),
  resolveDispatch: protectedProcedure.input(z.object({ dispatchId: z.number().int().positive(), decision: z.enum(["approved", "denied"]) })).mutation(async ({ ctx, input }) => {
    const dispatch = await resolveAgentDispatchForOwner(ctx.user.id, input.dispatchId, input.decision);
    const agents = await listAgentsForOwner(ctx.user.id); const agent = agents.find(item => item.id === dispatch.agentId);
    if (!agent) throw new Error("Agent not found");
    const outcome = input.decision === "approved" ? "success" as const : "denied" as const;
    await addAuditEvent(ctx.user.id, { action: `agent_dispatch.${input.decision}`, resourceType: "agent", resourceId: String(agent.id), outcome, detail: `${agent.name}: ${dispatch.task}. No external action was invoked.`, metadata: { dispatchId: dispatch.id, action: dispatch.action } });
    return { status: input.decision, execution: "not_invoked" as const };
  }),
});
