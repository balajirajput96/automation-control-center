import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addAuditEvent: vi.fn(),
  addContentSourceForOwner: vi.fn(),
  createContentProjectForOwner: vi.fn(),
  listContentProjectsForOwner: vi.fn(),
  listContentSourcesForOwner: vi.fn(),
  updateContentProjectStageForOwner: vi.fn(),
}));

vi.mock("../db", () => mocks);
import { contentRouter } from "./media";

const caller = (id: number) => contentRouter.createCaller({ user: { id } } as any);

describe("content lifecycle ownership procedures", () => {
  afterEach(() => vi.clearAllMocks());

  it("creates owner-scoped content projects and records their audit event", async () => {
    mocks.createContentProjectForOwner.mockResolvedValue(18);
    await expect(caller(42).create({ title: "Research brief", brief: "A source-grounded plan" })).resolves.toEqual({ id: 18 });
    expect(mocks.createContentProjectForOwner).toHaveBeenCalledWith(42, { title: "Research brief", brief: "A source-grounded plan" });
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "content_project.created", resourceId: "18" }));
  });

  it("updates the authenticated owner's lifecycle stage and emits an audit record", async () => {
    await expect(caller(42).setStage({ contentProjectId: 18, stage: "storyboard" })).resolves.toMatchObject({ success: true, stage: "storyboard" });
    expect(mocks.updateContentProjectStageForOwner).toHaveBeenCalledWith(42, 18, "storyboard");
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "content_project.stage_updated", resourceId: "18" }));
  });

  it("does not mask cross-owner stage rejection from the ownership helper", async () => {
    mocks.updateContentProjectStageForOwner.mockRejectedValue(new Error("Content project not found"));
    await expect(caller(99).setStage({ contentProjectId: 18, stage: "review" })).rejects.toThrow("Content project not found");
    expect(mocks.updateContentProjectStageForOwner).toHaveBeenCalledWith(99, 18, "review");
  });

  it("records owner-scoped research sources with credibility labels", async () => {
    await caller(42).addSource({ contentProjectId: 18, title: "Primary source", url: "https://example.com/source", sourceType: "article", credibility: "established", notes: "Verified context" });
    expect(mocks.addContentSourceForOwner).toHaveBeenCalledWith(42, expect.objectContaining({ contentProjectId: 18, credibility: "established" }));
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "research_source.added" }));
  });
});
