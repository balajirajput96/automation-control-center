import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addAuditEvent: vi.fn(),
  deleteScheduleForOwner: vi.fn(),
  setScheduleStateForOwner: vi.fn(),
}));

vi.mock("../db", () => mocks);

import { scheduleRouter } from "./workflows";

function scheduleCaller(ownerId: number) {
  return scheduleRouter.createCaller({ user: { id: ownerId } } as any);
}

describe("schedule lifecycle procedure", () => {
  afterEach(() => vi.clearAllMocks());

  it("keeps resume requests blocked until a signed execution adapter exists", async () => {
    await expect(scheduleCaller(42).setState({ id: 7, status: "active" })).resolves.toMatchObject({ success: false, status: "paused", reason: expect.stringContaining("idempotent execution handler") });
    expect(mocks.setScheduleStateForOwner).not.toHaveBeenCalled();
  });

  it("records owner-scoped pause and delete lifecycle events", async () => {
    await scheduleCaller(42).setState({ id: 7, status: "paused" });
    expect(mocks.setScheduleStateForOwner).toHaveBeenCalledWith(42, 7, "paused");
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "schedule.paused", resourceId: "7" }));

    await scheduleCaller(42).remove({ id: 7 });
    expect(mocks.deleteScheduleForOwner).toHaveBeenCalledWith(42, 7);
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "schedule.deleted", resourceId: "7" }));
  });
});
