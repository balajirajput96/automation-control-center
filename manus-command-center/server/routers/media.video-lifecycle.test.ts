import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addAuditEvent: vi.fn(),
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
});
