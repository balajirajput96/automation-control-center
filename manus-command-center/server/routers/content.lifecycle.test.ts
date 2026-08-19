import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addAuditEvent: vi.fn(),
  addContentCitationForOwner: vi.fn(),
  addContentExportForOwner: vi.fn(),
  addContentSourceForOwner: vi.fn(),
  createContentProjectForOwner: vi.fn(),
  listContentCitationsForOwner: vi.fn(),
  listContentProjectsForOwner: vi.fn(),
  listContentSourcesForOwner: vi.fn(),
  updateContentProjectArtifactsForOwner: vi.fn(),
  updateContentCitationForOwner: vi.fn(),
  updateContentProjectStageForOwner: vi.fn(),
  removeContentCitationForOwner: vi.fn(),
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

  it("persists owner-scoped structured content artifacts and records the audit boundary", async () => {
    await expect(caller(42).updateArtifacts({ contentProjectId: 18, outline: "Source-backed outline", script: "Narration draft", tags: ["research", "vertical-video"] })).resolves.toEqual({ success: true });
    expect(mocks.updateContentProjectArtifactsForOwner).toHaveBeenCalledWith(42, 18, { outline: "Source-backed outline", script: "Narration draft", tags: ["research", "vertical-video"] });
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "content_project.artifacts_updated", resourceId: "18" }));
  });

  it("records owner-scoped citations with section attribution", async () => {
    await expect(caller(42).addCitation({ contentProjectId: 18, section: "script", claim: "The source supports this claim", citationText: "Primary source, section 2" })).resolves.toEqual({ success: true });
    expect(mocks.addContentCitationForOwner).toHaveBeenCalledWith(42, expect.objectContaining({ contentProjectId: 18, section: "script", sourceId: null }));
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "content_citation.added", resourceId: "18" }));
  });

  it("updates an owner-scoped citation and records the audit event", async () => {
    await expect(caller(42).updateCitation({ contentProjectId: 18, citationId: 6, section: "outline", claim: "Updated claim", citationText: "Updated citation" })).resolves.toEqual({ success: true });
    expect(mocks.updateContentCitationForOwner).toHaveBeenCalledWith(42, 18, 6, expect.objectContaining({ section: "outline", sourceId: null, claim: "Updated claim" }));
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "content_citation.updated", resourceId: "18" }));
  });

  it("lists and removes citations only through the authenticated owner boundary", async () => {
    mocks.listContentCitationsForOwner.mockResolvedValue([{ id: 6, claim: "Claim" }]);
    await expect(caller(42).citations({ contentProjectId: 18 })).resolves.toEqual([{ id: 6, claim: "Claim" }]);
    expect(mocks.listContentCitationsForOwner).toHaveBeenCalledWith(42, 18);
    await expect(caller(42).removeCitation({ contentProjectId: 18, citationId: 6 })).resolves.toEqual({ success: true });
    expect(mocks.removeContentCitationForOwner).toHaveBeenCalledWith(42, 18, 6);
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "content_citation.removed", resourceId: "18" }));
  });

  it("does not mask cross-owner citation update rejection", async () => {
    mocks.updateContentCitationForOwner.mockRejectedValue(new Error("Content project not found"));
    await expect(caller(99).updateCitation({ contentProjectId: 18, citationId: 6, section: "script", claim: "Claim", citationText: "Citation" })).rejects.toThrow("Content project not found");
    expect(mocks.updateContentCitationForOwner).toHaveBeenCalledWith(99, 18, 6, expect.objectContaining({ claim: "Claim" }));
  });

  it("records owner-scoped export history with a non-delivery status", async () => {
    await expect(caller(42).addExport({ contentProjectId: 18, format: "markdown", status: "ready", destination: "editorial-review" })).resolves.toEqual({ success: true });
    expect(mocks.addContentExportForOwner).toHaveBeenCalledWith(42, expect.objectContaining({ contentProjectId: 18, format: "markdown", status: "ready", assetId: null }));
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "content_export.recorded", resourceId: "18", outcome: "success" }));
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
