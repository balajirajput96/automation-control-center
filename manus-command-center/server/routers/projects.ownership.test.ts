import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addAuditEvent: vi.fn(),
  createAgentForOwner: vi.fn(),
  createProjectForOwner: vi.fn(),
  deleteProjectForOwner: vi.fn(),
  listAgentsForOwner: vi.fn(),
  listProjectAuditEventsForOwner: vi.fn(),
  listProjectsForOwner: vi.fn(),
  updateAgentForOwner: vi.fn(),
  updateProjectForOwner: vi.fn(),
}));

vi.mock("../db", () => mocks);
import { agentRouter, projectRouter } from "./projects";

const caller = (id: number) => ({ project: projectRouter.createCaller({ user: { id } } as any), agent: agentRouter.createCaller({ user: { id } } as any) });

describe("project and agent ownership procedures", () => {
  afterEach(() => vi.clearAllMocks());

  it("creates and updates projects with owner-scoped audit events", async () => {
    mocks.createProjectForOwner.mockResolvedValue(12);
    await caller(42).project.create({ name: "Command Center", description: "Operations workspace", repositoryUrl: "https://github.com/owner/repo" });
    expect(mocks.createProjectForOwner).toHaveBeenCalledWith(42, { name: "Command Center", description: "Operations workspace", repositoryUrl: "https://github.com/owner/repo" });
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "project.created", resourceId: "12" }));

    await caller(42).project.update({ id: 12, name: "Command Center", description: "Updated workspace", repositoryUrl: "", status: "paused" });
    expect(mocks.updateProjectForOwner).toHaveBeenCalledWith(42, 12, expect.objectContaining({ description: "Updated workspace", repositoryUrl: null, status: "paused" }));
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "project.updated", resourceId: "12" }));
  });

  it("passes the authenticated owner to project mutations", async () => {
    await caller(42).project.remove({ id: 9 });
    expect(mocks.deleteProjectForOwner).toHaveBeenCalledWith(42, 9);
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "project.deleted", resourceId: "9" }));
  });

  it("blocks cross-owner project activity through the ownership-scoped helper path", async () => {
    mocks.listProjectAuditEventsForOwner.mockImplementation(async (ownerId: number) => {
      if (ownerId !== 42) throw new Error("Project not found");
      return [];
    });
    await expect(caller(99).project.activity({ id: 9 })).rejects.toThrow("Project not found");
    expect(mocks.listProjectAuditEventsForOwner).toHaveBeenCalledWith(99, 9);
  });

  it("does not dispatch an agent owned by another user", async () => {
    mocks.listAgentsForOwner.mockImplementation(async (ownerId: number) => ownerId === 42 ? [{ id: 7, name: "Owner Agent", autonomyLevel: "autonomous" }] : []);
    await expect(caller(99).agent.requestDispatch({ agentId: 7, task: "Attempt cross-owner dispatch", action: "research" })).rejects.toThrow("Agent not found");
  });

  it("records high-impact autonomous dispatches as approval-gated", async () => {
    mocks.listAgentsForOwner.mockResolvedValue([{ id: 7, name: "Owner Agent", autonomyLevel: "autonomous" }]);
    await expect(caller(42).agent.requestDispatch({ agentId: 7, task: "Deploy production build", action: "deploy" })).resolves.toMatchObject({ status: "needs_approval", policy: { decision: "needs_approval" } });
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "agent_dispatch.requested", outcome: "pending", resourceId: "7" }));
  });

  it("records owner-scoped approved and denied dispatch decisions without execution", async () => {
    mocks.listAgentsForOwner.mockResolvedValue([{ id: 7, name: "Owner Agent", autonomyLevel: "assisted" }]);
    await expect(caller(42).agent.resolveDispatch({ agentId: 7, task: "Publish approved briefing", decision: "approved" })).resolves.toEqual({ status: "approved", execution: "not_invoked" });
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "agent_dispatch.approved", outcome: "success", resourceId: "7" }));
    await expect(caller(42).agent.resolveDispatch({ agentId: 7, task: "Reject unsafe deploy", decision: "denied" })).resolves.toEqual({ status: "denied", execution: "not_invoked" });
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "agent_dispatch.denied", outcome: "denied", resourceId: "7" }));
  });
});
