import { afterEach, describe, expect, it, vi } from "vitest";
import { __setDbForTesting, createMaintenanceCycleIdempotencyKey, getMaintenanceCycleEligibility, recordReadOnlyMaintenanceCycleForTask } from "./db";

type Plan = { id: number; ownerId: number; enabled: boolean; cyclesCompleted: number; maxCycles: number };

function dbDouble(responses: unknown[]) {
  let selectIndex = 0;
  const inserts: unknown[] = [];
  const updates: unknown[] = [];
  const chain = (value: unknown, needsLimit = false) => ({ from: () => ({ where: () => needsLimit ? ({ limit: vi.fn().mockResolvedValue(value) }) : Promise.resolve(value) }) });
  return {
    db: {
      select: vi.fn(() => chain(responses[selectIndex++], selectIndex <= 2)),
      insert: vi.fn(() => ({ values: vi.fn(async (value: unknown) => { inserts.push(value); return [{ id: 1 }]; }) })),
      update: vi.fn(() => ({ set: vi.fn((value: unknown) => { updates.push(value); return { where: vi.fn(async () => undefined) }; }) })),
    } as any,
    inserts,
    updates,
  };
}

describe("maintenance cycle idempotency", () => {
  afterEach(() => __setDbForTesting(null));
  it("uses a stable authenticated task and UTC hour window", () => {
    expect(createMaintenanceCycleIdempotencyKey("task_abc", new Date("2026-08-22T09:34:56.000Z"))).toBe("task_abc:2026-08-22T09");
    expect(createMaintenanceCycleIdempotencyKey("task_abc", new Date("2026-08-22T09:59:59.000Z"))).toBe("task_abc:2026-08-22T09");
    expect(createMaintenanceCycleIdempotencyKey("task_abc", new Date("2026-08-22T10:00:00.000Z"))).toBe("task_abc:2026-08-22T10");
  });

  it("maps unbound, paused, capped, and active plans to safe read-only maintenance paths", () => {
    expect(getMaintenanceCycleEligibility(null)).toMatchObject({ status: "orphan" });
    expect(getMaintenanceCycleEligibility({ enabled: false, cyclesCompleted: 0, maxCycles: 2400 })).toMatchObject({ status: "skipped", summary: "Maintenance plan is paused; no checks were executed." });
    expect(getMaintenanceCycleEligibility({ enabled: true, cyclesCompleted: 2400, maxCycles: 2400 })).toMatchObject({ status: "skipped", summary: "Maintenance plan cycle limit reached; no checks were executed." });
    expect(getMaintenanceCycleEligibility({ enabled: true, cyclesCompleted: 12, maxCycles: 2400 })).toMatchObject({ status: "completed" });
  });

  it("uses the same key for duplicate deliveries in one hour and a new key in the next hour", () => {
    const first = createMaintenanceCycleIdempotencyKey("task_abc", new Date("2026-08-22T09:01:00.000Z"));
    const retry = createMaintenanceCycleIdempotencyKey("task_abc", new Date("2026-08-22T09:59:00.000Z"));
    const nextHour = createMaintenanceCycleIdempotencyKey("task_abc", new Date("2026-08-22T10:00:00.000Z"));
    expect(retry).toBe(first);
    expect(nextHour).not.toBe(first);
  });

  it("records an orphan callback without inserting a cycle", async () => {
    const test = dbDouble([[]]); __setDbForTesting(test.db);
    await expect(recordReadOnlyMaintenanceCycleForTask("orphan", new Date("2026-08-22T09:00:00Z"))).resolves.toMatchObject({ plan: null, status: "skipped" });
    expect(test.inserts).toEqual([]);
  });

  it("returns duplicate without creating a second cycle", async () => {
    const plan: Plan = { id: 1, ownerId: 42, enabled: true, cyclesCompleted: 0, maxCycles: 2400 };
    const test = dbDouble([[plan], [{ id: 5 }]]); __setDbForTesting(test.db);
    await expect(recordReadOnlyMaintenanceCycleForTask("task", new Date("2026-08-22T09:00:00Z"))).resolves.toMatchObject({ status: "duplicate" });
    expect(test.inserts).toEqual([]);
  });

  it("persists skipped cycles for paused and max-cycle plans", async () => {
    for (const plan of [{ id: 1, ownerId: 42, enabled: false, cyclesCompleted: 0, maxCycles: 2400 }, { id: 2, ownerId: 42, enabled: true, cyclesCompleted: 2400, maxCycles: 2400 }]) {
      const test = dbDouble([[plan], []]); __setDbForTesting(test.db);
      await expect(recordReadOnlyMaintenanceCycleForTask("task", new Date("2026-08-22T09:00:00Z"))).resolves.toMatchObject({ status: "skipped" });
      expect(test.inserts).toHaveLength(1);
    }
  });

  it("persists a completed read-only cycle and increments the bounded plan", async () => {
    const plan: Plan = { id: 1, ownerId: 42, enabled: true, cyclesCompleted: 2, maxCycles: 2400 };
    const test = dbDouble([[plan], [], [{ id: 2 }], [{ id: 3 }], [{ provider: "github", status: "healthy" }], [{ service: "github", connectionStatus: "connected" }]]); __setDbForTesting(test.db);
    await expect(recordReadOnlyMaintenanceCycleForTask("task", new Date("2026-08-22T09:00:00Z"))).resolves.toMatchObject({ status: "completed", details: expect.objectContaining({ readOnly: true, pendingWorkflowApprovals: 1, pendingDispatchApprovals: 1 }) });
    expect(test.inserts).toHaveLength(1);
    expect(test.updates).toHaveLength(1);
  });
});
