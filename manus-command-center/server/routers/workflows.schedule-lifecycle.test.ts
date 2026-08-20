import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addAuditEvent: vi.fn(),
  deleteScheduleForOwner: vi.fn(),
  listScheduleExecutionsForOwner: vi.fn(),
  setScheduleStateForOwner: vi.fn(),
  updateScheduleForOwner: vi.fn(),
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

  it("updates an owner-scoped schedule as paused and rejects malformed cron expressions", async () => {
    await scheduleCaller(42).update({ id: 7, workflowId: 3, name: "Morning digest", recurrenceType: "daily", timezone: "UTC" });
    expect(mocks.updateScheduleForOwner).toHaveBeenCalledWith(42, 7, expect.objectContaining({ workflowId: 3, name: "Morning digest", recurrenceType: "daily", timezone: "UTC" }));
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "schedule.updated", resourceId: "7", outcome: "success" }));

    await expect(scheduleCaller(42).update({ id: 7, workflowId: 3, name: "Cron digest", recurrenceType: "cron", cronExpression: "0 9 *", timezone: "UTC" })).rejects.toThrow("six-field UTC expression");
    expect(mocks.updateScheduleForOwner).toHaveBeenCalledTimes(1);
  });

  it("validates structured weekly and event recurrence definitions when configured", async () => {
    await expect(scheduleCaller(42).update({ id: 7, workflowId: 3, name: "Weekly digest", recurrenceType: "weekly", timezone: "UTC", recurrenceConfig: { dayOfWeek: 7 } })).rejects.toThrow("dayOfWeek from 0 to 6");
    await expect(scheduleCaller(42).update({ id: 7, workflowId: 3, name: "Event digest", recurrenceType: "event", timezone: "UTC", recurrenceConfig: {} })).rejects.toThrow("eventName");
    await scheduleCaller(42).update({ id: 7, workflowId: 3, name: "Weekly digest", recurrenceType: "weekly", timezone: "UTC", recurrenceConfig: { dayOfWeek: 1 } });
    expect(mocks.updateScheduleForOwner).toHaveBeenCalledWith(42, 7, expect.objectContaining({ recurrenceConfig: { dayOfWeek: 1 } }));
  });

  it("accepts each supported recurrence type through the paused definition lifecycle", async () => {
    const definitions = [
      { recurrenceType: "once" as const, recurrenceConfig: { runAt: "2026-08-20T09:00:00Z" } },
      { recurrenceType: "hourly" as const },
      { recurrenceType: "daily" as const },
      { recurrenceType: "weekly" as const, recurrenceConfig: { dayOfWeek: 1 } },
      { recurrenceType: "monthly" as const, recurrenceConfig: { dayOfMonth: 15 } },
      { recurrenceType: "cron" as const, cronExpression: "0 0 9 * * *" },
      { recurrenceType: "event" as const, recurrenceConfig: { eventName: "content.project.approved" } },
    ];
    for (const definition of definitions) {
      await expect(scheduleCaller(42).update({ id: 7, workflowId: 3, name: `${definition.recurrenceType} definition`, timezone: "UTC", ...definition })).resolves.toMatchObject({ status: "paused" });
    }
    expect(mocks.updateScheduleForOwner).toHaveBeenCalledTimes(definitions.length);
  });

  it("lists callback execution history only through the authenticated owner scope", async () => {
    mocks.listScheduleExecutionsForOwner.mockResolvedValue([{ id: 4, ownerId: 42, scheduleId: 7, status: "blocked" }]);
    await expect(scheduleCaller(42).history({ scheduleId: 7 })).resolves.toEqual([{ id: 4, ownerId: 42, scheduleId: 7, status: "blocked" }]);
    expect(mocks.listScheduleExecutionsForOwner).toHaveBeenCalledWith(42, 7);
  });
});
