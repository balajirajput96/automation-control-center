import { protectedProcedure, router } from "../_core/trpc";
import { addAuditEvent, createMaintenancePlanForOwner, listMaintenanceCyclesForOwner, listMaintenancePlansForOwner } from "../db";
import { z } from "zod";

export const maintenanceRouter = router({
  plans: protectedProcedure.query(({ ctx }) => listMaintenancePlansForOwner(ctx.user.id)),
  cycles: protectedProcedure.input(z.object({ maintenancePlanId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => listMaintenanceCyclesForOwner(ctx.user.id, input?.maintenancePlanId)),
  createPlan: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), maxCycles: z.number().int().min(1).max(2400).default(2400) })).mutation(async ({ ctx, input }) => {
    const id = await createMaintenancePlanForOwner(ctx.user.id, { name: input.name, maxCycles: input.maxCycles, intervalMinutes: 60 });
    await addAuditEvent(ctx.user.id, { action: "maintenance_plan.created", resourceType: "maintenance_plan", resourceId: String(id ?? ""), outcome: "success", detail: `Created a bounded ${input.maxCycles}-cycle hourly read-only maintenance plan. No schedule task, repository mutation, deployment, or external action is enabled by this record.` });
    return { id, status: "awaiting_authenticated_schedule_binding" as const };
  }),
});
