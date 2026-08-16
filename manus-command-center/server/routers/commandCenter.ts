import { listLLMModels } from "../_core/llm";
import { ensureIntegrationRegistry, getCommandCenterSnapshot, listDeploymentTargetsForOwner, listIntegrationsForOwner, searchAuditEventsForOwner, updateIntegrationHealth } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const commandCenterRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    await ensureIntegrationRegistry(ctx.user.id);
    return getCommandCenterSnapshot(ctx.user.id);
  }),
  integrationHealth: protectedProcedure.query(async ({ ctx }) => {
    let modelCount = 0;
    let modelCatalogState: "available" | "error" = "available";
    try {
      modelCount = (await listLLMModels()).data.length;
    } catch {
      modelCatalogState = "error";
    }
    await ensureIntegrationRegistry(ctx.user.id);
    await updateIntegrationHealth(ctx.user.id, "model_catalog", { connectionStatus: modelCatalogState, lastError: modelCatalogState === "error" ? "Model catalog health check failed." : null, permissionSummary: modelCatalogState === "available" ? `${modelCount} authorized runtime models discovered.` : "Model catalog could not be reached." });
    const registry = await listIntegrationsForOwner(ctx.user.id);
    return registry.map(item => ({ service: item.service, displayName: item.displayName, category: item.category, connectionStatus: item.connectionStatus, detail: item.permissionSummary || item.lastError || "No connection detail recorded.", lastHealthCheckAt: item.lastHealthCheckAt }));
  }),
  logs: protectedProcedure.input(z.object({ query: z.string().trim().max(160).optional() })).query(({ ctx, input }) => searchAuditEventsForOwner(ctx.user.id, input.query)),
  deploymentTargets: protectedProcedure.query(({ ctx }) => listDeploymentTargetsForOwner(ctx.user.id)),
});
