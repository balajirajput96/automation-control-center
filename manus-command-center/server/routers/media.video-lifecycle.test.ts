import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addAuditEvent: vi.fn(),
  createVideoJobForOwner: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("../db", () => mocks);

import { videoRouter } from "./media";

function videoCaller(ownerId: number) {
  return videoRouter.createCaller({ user: { id: ownerId } } as any);
}

function ownerScopedVideoDb(job?: { id: number; title: string; editPlan: unknown }) {
  const where = vi.fn(() => ({ limit: vi.fn().mockResolvedValue(job ? [job] : []) }));
  const from = vi.fn(() => ({ where }));
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn(() => ({ where: updateWhere }));
  return { db: { select: vi.fn(() => ({ from })), update: vi.fn(() => ({ set })) }, updateWhere };
}

describe("video lifecycle procedure", () => {
  afterEach(() => vi.clearAllMocks());

  it("forwards managed source, thumbnail, and output references into the owner-scoped video plan", async () => {
    await expect(videoCaller(42).create({ title: "Asset-linked vertical plan", outputFormat: "vertical_9_16", targetDurationSeconds: 60, contentProjectId: 18, sourceAssetId: 3, thumbnailAssetId: 4, outputAssetId: 5, storageMetadata: { source: "managed-media" } })).resolves.toMatchObject({ renderState: "draft" });
    expect(mocks.createVideoJobForOwner).toHaveBeenCalledWith(42, expect.objectContaining({ contentProjectId: 18, sourceAssetId: 3, thumbnailAssetId: 4, outputAssetId: 5, storageMetadata: { source: "managed-media" } }));
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "video_job.created" }));
  });

  it("records an owner-scoped external handoff without invoking a renderer", async () => {
    const { db } = ownerScopedVideoDb({ id: 7, title: "Vertical research short", editPlan: {} });
    mocks.getDb.mockResolvedValue(db);

    await expect(videoCaller(42).requestExternalHandoff({ id: 7 })).resolves.toMatchObject({ status: "needs_review", nextStep: "review_external_renderer" });
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "video_job.external_handoff_requested", resourceId: "7", outcome: "pending" }));
  });

  it("rejects a video job that is not visible to the authenticated owner", async () => {
    const { db } = ownerScopedVideoDb();
    mocks.getDb.mockResolvedValue(db);

    await expect(videoCaller(99).requestExternalHandoff({ id: 7 })).rejects.toThrow("Video job not found");
    expect(mocks.addAuditEvent).not.toHaveBeenCalled();
  });

  it("records an owner-scoped blocked video plan without invoking a renderer", async () => {
    const { db } = ownerScopedVideoDb({ id: 7, title: "Vertical research short", editPlan: {} });
    mocks.getDb.mockResolvedValue(db);

    await expect(videoCaller(42).setReadiness({ id: 7, status: "failed", errorMessage: "Blocked for review" })).resolves.toMatchObject({ status: "failed" });
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "video_job.readiness_updated", resourceId: "7", outcome: "failure", detail: expect.stringContaining("Blocked for review") }));
  });
});
