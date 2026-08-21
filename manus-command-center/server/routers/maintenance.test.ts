import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addAuditEvent: vi.fn(),
  createMaintenancePlanForOwner: vi.fn(),
  listMaintenanceCyclesForOwner: vi.fn(),
  listMaintenancePlansForOwner: vi.fn(),
}));

vi.mock("../db", () => mocks);

import { maintenanceRouter } from "./maintenance";

function caller(ownerId = 42) {
  return maintenanceRouter.createCaller({ user: { id: ownerId } } as any);
}

describe("maintenance router", () => {
  it("creates a bounded read-only plan in the authenticated owner scope", async () => {
    mocks.createMaintenancePlanForOwner.mockResolvedValue(9);
    await expect(caller(42).createPlan({ name: "Bounded review", maxCycles: 2400 })).resolves.toEqual({ id: 9, status: "awaiting_authenticated_schedule_binding" });
    expect(mocks.createMaintenancePlanForOwner).toHaveBeenCalledWith(42, { name: "Bounded review", maxCycles: 2400, intervalMinutes: 60 });
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "maintenance_plan.created", detail: expect.stringContaining("No schedule task") }));
  });

  it("lists only authenticated owner plans and cycles", async () => {
    mocks.listMaintenancePlansForOwner.mockResolvedValue([{ id: 2, ownerId: 42 }]);
    mocks.listMaintenanceCyclesForOwner.mockResolvedValue([{ id: 4, ownerId: 42, maintenancePlanId: 2 }]);
    await expect(caller(42).plans()).resolves.toEqual([{ id: 2, ownerId: 42 }]);
    await expect(caller(42).cycles({ maintenancePlanId: 2 })).resolves.toEqual([{ id: 4, ownerId: 42, maintenancePlanId: 2 }]);
    expect(mocks.listMaintenancePlansForOwner).toHaveBeenCalledWith(42);
    expect(mocks.listMaintenanceCyclesForOwner).toHaveBeenCalledWith(42, 2);
  });
});
