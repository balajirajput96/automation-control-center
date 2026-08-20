import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addAuditEvent: vi.fn(),
  getDb: vi.fn(),
  listWorkflowRunsForOwner: vi.fn(),
}));

vi.mock("../db", () => mocks);
import { workflowRouter } from "./workflows";

const caller = (id: number) => workflowRouter.createCaller({ user: { id } } as any);

describe("workflow run approval resolution", () => {
  afterEach(() => vi.clearAllMocks());

  it("records approved and denied owner-scoped run decisions without executing adapters", async () => {
    const where = vi.fn(); const set = vi.fn(() => ({ where })); const update = vi.fn(() => ({ set }));
    mocks.getDb.mockResolvedValue({ update });
    mocks.listWorkflowRunsForOwner.mockResolvedValue([{ id: 12, status: "needs_approval" }]);

    await expect(caller(42).resolveRun({ runId: 12, decision: "approved" })).resolves.toEqual({ status: "queued", execution: "not_invoked" });
    expect(mocks.listWorkflowRunsForOwner).toHaveBeenCalledWith(42);
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "workflow_run.approved", outcome: "success", resourceId: "12" }));

    await expect(caller(42).resolveRun({ runId: 12, decision: "denied" })).resolves.toEqual({ status: "cancelled", execution: "not_invoked" });
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "workflow_run.denied", outcome: "denied", resourceId: "12" }));
  });

  it("rejects run decisions for records outside the authenticated owner scope", async () => {
    mocks.listWorkflowRunsForOwner.mockResolvedValue([]);
    await expect(caller(99).resolveRun({ runId: 12, decision: "approved" })).rejects.toThrow("Workflow run not found");
  });

  it("returns owner-scoped run status, retry, and error details for the execution trace surface", async () => {
    const trace = [{ id: 12, ownerId: 42, workflowId: 4, status: "failed", triggerSource: "schedule", retryCount: 2, errorMessage: "Adapter unavailable" }];
    mocks.listWorkflowRunsForOwner.mockResolvedValue(trace);
    await expect(caller(42).runs()).resolves.toEqual(trace);
    expect(mocks.listWorkflowRunsForOwner).toHaveBeenCalledWith(42);
  });
});
