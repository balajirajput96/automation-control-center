import { callDataApi } from "../_core/dataApi";
import { protectedProcedure, router } from "../_core/trpc";
import { addAuditEvent, createNiftyAlertDefinitionForOwner, createNiftyWatchDefinitionForOwner, deleteNiftyAlertDefinitionForOwner, deleteNiftyWatchDefinitionForOwner, listNiftyAlertDefinitionsForOwner, listNiftyWatchDefinitionsForOwner } from "../db";
import { z } from "zod";

export const marketRouter = router({
  alerts: protectedProcedure.query(({ ctx }) => listNiftyAlertDefinitionsForOwner(ctx.user.id)),
  createAlert: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), thresholdPercent: z.number().min(0.1).max(20), timezone: z.string().trim().min(1).max(64).default("Asia/Kolkata") })).mutation(async ({ ctx, input }) => {
    const id = await createNiftyAlertDefinitionForOwner(ctx.user.id, { name: input.name, thresholdBasisPoints: Math.round(input.thresholdPercent * 100), timezone: input.timezone });
    await addAuditEvent(ctx.user.id, { action: "nifty_alert.created", resourceType: "nifty_alert", resourceId: String(id ?? ""), outcome: "success", detail: `Created informational daily-close alert definition at ${input.thresholdPercent.toFixed(2)}%; delayed data is disclosed, and delivery is not scheduled or enabled.` });
    return { id, deliveryState: "not_scheduled" as const };
  }),
  removeAlert: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await deleteNiftyAlertDefinitionForOwner(ctx.user.id, input.id);
    await addAuditEvent(ctx.user.id, { action: "nifty_alert.deleted", resourceType: "nifty_alert", resourceId: String(input.id), outcome: "success", detail: "Removed informational NIFTY alert definition; no delivery was scheduled or sent." });
    return { success: true };
  }),
  watches: protectedProcedure.query(({ ctx }) => listNiftyWatchDefinitionsForOwner(ctx.user.id)),
  createWatch: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), thresholdPercent: z.number().min(0.1).max(20), timezone: z.string().trim().min(1).max(64).default("Asia/Kolkata") })).mutation(async ({ ctx, input }) => {
    const id = await createNiftyWatchDefinitionForOwner(ctx.user.id, { name: input.name, thresholdBasisPoints: Math.round(input.thresholdPercent * 100), timezone: input.timezone });
    await addAuditEvent(ctx.user.id, { action: "nifty_watch.created", resourceType: "nifty_watch", resourceId: String(id ?? ""), outcome: "success", detail: `Created informational daily-close observation at ${input.thresholdPercent.toFixed(2)}%; no alert delivery or trading action is enabled.` });
    return { id, scheduler: "not_configured" as const };
  }),
  removeWatch: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await deleteNiftyWatchDefinitionForOwner(ctx.user.id, input.id);
    await addAuditEvent(ctx.user.id, { action: "nifty_watch.deleted", resourceType: "nifty_watch", resourceId: String(input.id), outcome: "success", detail: "Removed informational NIFTY watch definition; no scheduler or alert delivery was active." });
    return { success: true };
  }),
  nifty: protectedProcedure.query(async () => {
    const raw = await callDataApi("YahooFinance/get_stock_chart", { query: { symbol: "^NSEI", region: "IN", interval: "1d", range: "3mo", includeAdjustedClose: "true" } }) as { chart?: { result?: Array<{ meta?: Record<string, unknown>; timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> } };
    const result = raw.chart?.result?.[0];
    if (!result?.meta) throw new Error("NIFTY market data was unavailable from the configured source");
    const timestamps = result.timestamp ?? []; const closes = result.indicators?.quote?.[0]?.close ?? [];
    const points = timestamps.map((timestamp, index) => ({ timestamp: timestamp * 1000, close: closes[index] ?? null })).filter(point => point.close !== null);
    const latest = points.at(-1)?.close ?? null; const prior = points.at(-2)?.close ?? null;
    return { symbol: "^NSEI", name: String(result.meta.longName || result.meta.shortName || "NIFTY 50"), currency: String(result.meta.currency || "INR"), latest, change: latest !== null && prior !== null ? latest - prior : null, changePercent: latest !== null && prior ? ((latest - prior) / prior) * 100 : null, points, source: "Yahoo Finance via Manus Data API", retrievedAt: new Date().toISOString(), dataStatus: "source-delayed" as const };
  }),
});
