import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { videoJobs } from "../../drizzle/schema";
import { generateImage, listImageModels } from "../_core/imageGeneration";
import { addAuditEvent, addContentSourceForOwner, addMediaAssetForOwner, createContentProjectForOwner, createVideoJobForOwner, getDb, listContentProjectsForOwner, listContentSourcesForOwner, listMediaAssetsForOwner, listVideoJobsForOwner } from "../db";
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
  sources: protectedProcedure.input(z.object({ contentProjectId: z.number().int().positive() })).query(({ ctx, input }) => listContentSourcesForOwner(ctx.user.id, input.contentProjectId)),
  addSource: protectedProcedure.input(z.object({ contentProjectId: z.number().int().positive(), title: z.string().trim().min(2).max(500), url: z.string().url().max(2000), sourceType: z.string().trim().min(2).max(80), credibility: z.enum(credibility), notes: z.string().trim().max(4000).optional() })).mutation(async ({ ctx, input }) => {
    await addContentSourceForOwner(ctx.user.id, input);
    await addAuditEvent(ctx.user.id, { action: "research_source.added", resourceType: "content_source", outcome: "success", detail: `Added ${input.credibility} source ${input.title}.` });
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
    await addMediaAssetForOwner(ctx.user.id, { contentProjectId: input.contentProjectId ?? null, kind: input.kind, name: input.name, storageKey: stored.key, storageUrl: stored.url, mimeType: input.mimeType, metadata: { uploaded: true, byteLength: bytes.length } });
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
  setReadiness: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["draft", "queued", "needs_review"]) })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new Error("Database is unavailable");
    await db.update(videoJobs).set({ status: input.status }).where(and(eq(videoJobs.id, input.id), eq(videoJobs.ownerId, ctx.user.id)));
    await addAuditEvent(ctx.user.id, { action: "video_job.readiness_updated", resourceType: "video_job", resourceId: String(input.id), outcome: input.status === "queued" ? "pending" : "success", detail: input.status === "queued" ? "Queued for an external render adapter; no render was simulated." : `Set video job readiness to ${input.status}.` });
    return { success: true, status: input.status };
  }),
});
