import { listLLMModels } from "../_core/llm";
import { ensureIntegrationRegistry, getCommandCenterSnapshot, listDeploymentTargetsForOwner, listIntegrationsForOwner, searchAuditEventsForOwner, updateDeploymentTargetHealth, updateIntegrationHealth } from "../db";
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
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) {
      try {
        const response = await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${githubToken}`, Accept: "application/vnd.github+json", "User-Agent": "ai-automation-command-center" } });
        if (!response.ok) throw new Error(`GitHub request failed (${response.status})`);
        const profile = await response.json() as { login?: string };
        await updateIntegrationHealth(ctx.user.id, "github", { connectionStatus: "connected", lastError: null, permissionSummary: `Authenticated GitHub access verified for ${profile.login || "the configured account"}.` });
        await updateDeploymentTargetHealth(ctx.user.id, "github", { status: "healthy", detail: `Credential-backed GitHub verification succeeded for ${profile.login || "the configured account"}.` });
      } catch (error) {
        await updateIntegrationHealth(ctx.user.id, "github", { connectionStatus: "error", lastError: error instanceof Error ? error.message : "GitHub credential health check failed.", permissionSummary: "Configured GitHub credential could not be verified." });
        await updateDeploymentTargetHealth(ctx.user.id, "github", { status: "failed", detail: error instanceof Error ? error.message : "GitHub credential health check failed." });
      }
    }
    await Promise.all([
      ["gmail", "Gmail authorization is not configured; health check was not run."],
      ["instagram", "Official Instagram publishing authorization is not configured; health check was not run."],
      ["vercel", "Vercel credential and project mapping are not configured; health check was not run."],
      ["cloudflare", "Cloudflare credential and zone mapping are not configured; health check was not run."],
      ["google_cloud", "Google Cloud service credential and deployment target are not configured; health check was not run."],
    ].map(([service, detail]) => updateIntegrationHealth(ctx.user.id, service, { connectionStatus: "action_required", lastError: detail, permissionSummary: detail })),
    );
    const registry = await listIntegrationsForOwner(ctx.user.id);
    return registry.map(item => ({ service: item.service, displayName: item.displayName, category: item.category, connectionStatus: item.connectionStatus, detail: item.permissionSummary || item.lastError || "No connection detail recorded.", lastHealthCheckAt: item.lastHealthCheckAt, verificationState: item.connectionStatus === "action_required" && item.lastError ? "unavailable_configured_boundary" as const : item.lastHealthCheckAt ? "provider_verified" as const : "registry_default" as const }));
  }),
  logs: protectedProcedure.input(z.object({ query: z.string().trim().max(160).optional(), outcome: z.enum(["success", "pending", "failure", "denied"]).optional() })).query(({ ctx, input }) => searchAuditEventsForOwner(ctx.user.id, input)),
  deploymentTargets: protectedProcedure.query(({ ctx }) => listDeploymentTargetsForOwner(ctx.user.id)),
});
