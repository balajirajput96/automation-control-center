import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { videoJobs } from "../../drizzle/schema";
import { generateImage, listImageModels } from "../_core/imageGeneration";
import { addAuditEvent, addContentCitationForOwner, addContentExportForOwner, addContentSourceForOwner, addMediaAssetForOwner, createContentProjectForOwner, createVideoJobForOwner, getDb, listContentCitationsForOwner, listContentExportsForOwner, listContentProjectsForOwner, listContentSourcesForOwner, listMediaAssetsForOwner, listVideoJobsForOwner, removeContentCitationForOwner, removeContentExportForOwner, updateContentProjectArtifactsForOwner, updateContentProjectStageForOwner } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const credibility = ["established", "emerging", "opinion", "hypothesis", "unreviewed"] as const;

export const contentRouter = router({
  list: protectedProcedure.query(({ ctx }) => listContentProjectsForOwner(ctx.user.id)),
  create: protectedProcedure.input(z.object({ title: z.string().trim().min(2).max(255), brief: z.string().trim().max(12000).optional() })).mutation(async ({ ctx, input }) => {
    const id = await createContentProjectForOwner(ctx.user.id, input);
    await addAuditEvent(ctx.user.id, { action: "content_project.created", resourceType: "content_project", resourceId: String(id ?? ""), outcome: "success", detail: `Created content project ${input.title}.` });
    return { id };
  }),
  setStage: protectedProcedure.input(z.object({ contentProjectId: z.number().int().positive(), stage: z.enum(["research", "outline", "script", "storyboard", "production", "review", "exported"]) })).mutation(async ({ ctx, input }) => {
    await updateContentProjectStageForOwner(ctx.user.id, input.contentProjectId, input.stage);
    await addAuditEvent(ctx.user.id, { action: "content_project.stage_updated", resourceType: "content_project", resourceId: String(input.contentProjectId), outcome: "success", detail: `Set content project stage to ${input.stage}.` });
    return { success: true, stage: input.stage };
  }),
  updateArtifacts: protectedProcedure.input(z.object({ contentProjectId: z.number().int().positive(), outline: z.string().trim().max(24000).optional(), script: z.string().trim().max(48000).optional(), storyboard: z.string().trim().max(24000).optional(), exportNotes: z.string().trim().max(12000).optional(), tags: z.array(z.string().trim().min(1).max(40)).max(20).optional() })).mutation(async ({ ctx, input }) => {
    const { contentProjectId, ...metadata } = input;
    await updateContentProjectArtifactsForOwner(ctx.user.id, contentProjectId, metadata);
    await addAuditEvent(ctx.user.id, { action: "content_project.artifacts_updated", resourceType: "content_project", resourceId: String(contentProjectId), outcome: "success", detail: "Updated structured outline, script, storyboard, metadata, or export notes." });
    return { success: true };
  }),
  sources: protectedProcedure.input(z.object({ contentProjectId: z.number().int().positive() })).query(({ ctx, input }) => listContentSourcesForOwner(ctx.user.id, input.contentProjectId)),
  addSource: protectedProcedure.input(z.object({ contentProjectId: z.number().int().positive(), title: z.string().trim().min(2).max(500), url: z.string().url().max(2000), sourceType: z.string().trim().min(2).max(80), credibility: z.enum(credibility), notes: z.string().trim().max(4000).optional() })).mutation(async ({ ctx, input }) => {
    await addContentSourceForOwner(ctx.user.id, input);
    await addAuditEvent(ctx.user.id, { action: "research_source.added", resourceType: "content_source", outcome: "success", detail: `Added ${input.credibility} source ${input.title}.` });
    return { success: true };
  }),
  citations: protectedProcedure.input(z.object({ contentProjectId: z.number().int().positive() })).query(({ ctx, input }) => listContentCitationsForOwner(ctx.user.id, input.contentProjectId)),
  addCitation: protectedProcedure.input(z.object({ contentProjectId: z.number().int().positive(), sourceId: z.number().int().positive().optional(), section: z.enum(["outline", "script", "storyboard", "export_notes"]), locator: z.string().trim().max(500).optional(), claim: z.string().trim().min(2).max(24000), citationText: z.string().trim().min(2).max(24000) })).mutation(async ({ ctx, input }) => {
    await addContentCitationForOwner(ctx.user.id, { ...input, sourceId: input.sourceId ?? null, locator: input.locator || null });
    await addAuditEvent(ctx.user.id, { action: "content_citation.added", resourceType: "content_project", resourceId: String(input.contentProjectId), outcome: "success", detail: `Added ${input.section} citation.` });
    return { success: true };
  }),
  removeCitation: protectedProcedure.input(z.object({ contentProjectId: z.number().int().positive(), citationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await removeContentCitationForOwner(ctx.user.id, input.contentProjectId, input.citationId);
    await addAuditEvent(ctx.user.id, { action: "content_citation.removed", resourceType: "content_project", resourceId: String(input.contentProjectId), outcome: "success", detail: `Removed citation ${input.citationId}.` });
    return { success: true };
  }),
  exports: protectedProcedure.input(z.object({ contentProjectId: z.number().int().positive() })).query(({ ctx, input }) => listContentExportsForOwner(ctx.user.id, input.contentProjectId)),
  addExport: protectedProcedure.input(z.object({ contentProjectId: z.number().int().positive(), assetId: z.number().int().positive().optional(), format: z.string().trim().min(2).max(100), status: z.enum(["planned", "ready", "exported", "failed"]), destination: z.string().trim().max(500).optional(), notes: z.string().trim().max(12000).optional() })).mutation(async ({ ctx, input }) => {
    await addContentExportForOwner(ctx.user.id, { ...input, assetId: input.assetId ?? null, destination: input.destination || null, notes: input.notes || null });
    await addAuditEvent(ctx.user.id, { action: "content_export.recorded", resourceType: "content_project", resourceId: String(input.contentProjectId), outcome: input.status === "failed" ? "failure" : "success", detail: `Recorded ${input.status} ${input.format} export.` });
    return { success: true };
  }),
  removeExport: protectedProcedure.input(z.object({ contentProjectId: z.number().int().positive(), exportId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await removeContentExportForOwner(ctx.user.id, input.contentProjectId, input.exportId);
    await addAuditEvent(ctx.user.id, { action: "content_export.removed", resourceType: "content_project", resourceId: String(input.contentProjectId), outcome: "success", detail: `Removed export ${input.exportId}.` });
    return { success: true };
  }),
});

export const mediaRouter = router({
  list: protectedProcedure.query(({ ctx }) => listMediaAssetsForOwner(ctx.user.id)),
  upload: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(255), kind: z.enum(["image", "audio", "video", "thumbnail", "document", "other"]), mimeType: z.string().trim().min(3).max(160), dataBase64: z.string().min(4).max(8_000_000), contentProjectId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
    if (!/^(image|audio|video)\/[a-z0-9.+-]+$|^application\/(pdf|json|octet-stream)$/i.test(input.mimeType)) throw new Error("Unsupported media MIME type");
    const bytes = Buffer.from(input.dataBase64, "base64");
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new Error("Uploads must be between 1 byte and 5 MB");
    const safeName = input.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "asset";
    const stored = await storagePut(`command-center/${ctx.user.id}/media/${safeName}`, bytes, input.mimeType);
    await addMediaAssetForOwner(ctx.user.id, { contentProjectId: input.contentProjectId ?? null, kind: input.kind, name: input.name, storageKey: stored.key, storageUrl: stored.url, mimeType: input.mimeType, bytes: bytes.length, metadata: { uploaded: true, byteLength: bytes.length } });
    await addAuditEvent(ctx.user.id, { action: "media.uploaded", resourceType: "media_asset", outcome: "success", detail: `Stored ${input.kind} asset ${input.name}.` });
    return { url: stored.url, key: stored.key };
  }),
  imageModels: protectedProcedure.query(async () => (await listImageModels()).models),
  generateImage: protectedProcedure.input(z.object({ prompt: z.string().trim().min(10).max(6000), model: z.string().trim().min(1).max(160).optional(), name: z.string().trim().min(2).max(255).optional() })).mutation(async ({ ctx, input }) => {
    const models = (await listImageModels()).models;
    const model = input.model ? models.find(item => item.model === input.model)?.model : undefined;
    if (input.model && !model) throw new Error("Selected image model is not available");
    const result = await generateImage({ prompt: input.prompt, model });
    if (!result.url) throw new Error("Image generation returned no asset URL");
    const assetName = input.name || `Generated visual ${new Date().toLocaleString()}`;
    await addMediaAssetForOwner(ctx.user.id, { kind: "image", name: assetName, storageKey: result.url, storageUrl: result.url, mimeType: "image/png", metadata: { prompt: input.prompt, model: model ?? "default", generated: true } });
    await addAuditEvent(ctx.user.id, { action: "image.generated", resourceType: "media_asset", outcome: "success", detail: `Generated visual asset ${assetName}.` });
    return { url: result.url, name: assetName };
  }),
});

export const videoRouter = router({
  list: protectedProcedure.query(({ ctx }) => listVideoJobsForOwner(ctx.user.id)),
  create: protectedProcedure.input(z.object({ title: z.string().trim().min(2).max(255), outputFormat: z.enum(["vertical_9_16", "landscape_16_9", "square_1_1"]), targetDurationSeconds: z.number().int().min(5).max(3600), contentProjectId: z.number().int().positive().optional(), editPlan: z.object({ clipping: z.boolean(), silenceRemoval: z.boolean(), captions: z.boolean(), voiceOver: z.boolean(), subtitles: z.boolean(), aspectRatioConversion: z.boolean(), execution: z.literal("external_render_required") }).optional() })).mutation(async ({ ctx, input }) => {
    await createVideoJobForOwner(ctx.user.id, input);
    await addAuditEvent(ctx.user.id, { action: "video_job.created", resourceType: "video_job", outcome: "pending", detail: `Created ${input.outputFormat} render plan with ${input.editPlan ? "explicit edit operations" : "default operations"} for ${input.title}.` });
    return { success: true, renderState: "draft" as const };
  }),
  setReadiness: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["draft", "queued", "needs_review", "failed"]), errorMessage: z.string().trim().min(3).max(4000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new Error("Database is unavailable");
    const existing = await db.select({ id: videoJobs.id, title: videoJobs.title, editPlan: videoJobs.editPlan }).from(videoJobs).where(and(eq(videoJobs.id, input.id), eq(videoJobs.ownerId, ctx.user.id))).limit(1);
    if (!existing[0]) throw new Error("Video job not found");
    const errorMessage = input.status === "failed" ? (input.errorMessage || "Video plan blocked before external rendering.") : null;
    await db.update(videoJobs).set({ status: input.status, errorMessage }).where(eq(videoJobs.id, existing[0].id));
    await addAuditEvent(ctx.user.id, { action: "video_job.readiness_updated", resourceType: "video_job", resourceId: String(input.id), outcome: input.status === "queued" ? "pending" : input.status === "failed" ? "failure" : "success", detail: input.status === "queued" ? "Queued for an external render adapter; no render was simulated." : input.status === "failed" ? `Marked blocked before rendering: ${errorMessage}` : `Set video job readiness to ${input.status}.` });
    return { success: true, status: input.status };
  }),
  exportReadiness: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new Error("Database is unavailable");
    const job = await db.select({ id: videoJobs.id, status: videoJobs.status, editPlan: videoJobs.editPlan }).from(videoJobs).where(and(eq(videoJobs.id, input.id), eq(videoJobs.ownerId, ctx.user.id))).limit(1);
    if (!job[0]) throw new Error("Video job not found");
    const plan = job[0].editPlan as { execution?: string } | null;
    const ready = job[0].status === "needs_review" && plan?.execution === "external_render_required";
    return { ready, status: job[0].status, nextStep: ready ? "review_external_renderer" as const : "complete_edit_plan_and_request_handoff" as const, reason: ready ? "Ready for human review before an external renderer is selected." : "Export is not ready until the edit plan is submitted for external-render review." };
  }),
  requestExternalHandoff: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new Error("Database is unavailable");
    const existing = await db.select({ id: videoJobs.id, title: videoJobs.title, editPlan: videoJobs.editPlan }).from(videoJobs).where(and(eq(videoJobs.id, input.id), eq(videoJobs.ownerId, ctx.user.id))).limit(1);
    if (!existing[0]) throw new Error("Video job not found");
    await db.update(videoJobs).set({ status: "needs_review" }).where(eq(videoJobs.id, existing[0].id));
    await addAuditEvent(ctx.user.id, { action: "video_job.external_handoff_requested", resourceType: "video_job", resourceId: String(existing[0].id), outcome: "pending", detail: `External render handoff for ${existing[0].title} is ready for human review; no external render service was invoked.` });
    return { success: true, status: "needs_review" as const, nextStep: "review_external_renderer" as const };
  }),
});
