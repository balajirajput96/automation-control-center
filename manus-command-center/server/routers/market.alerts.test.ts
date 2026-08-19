import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addAuditEvent: vi.fn(),
  createNiftyAlertDefinitionForOwner: vi.fn(),
  createNiftyWatchDefinitionForOwner: vi.fn(),
  deleteNiftyAlertDefinitionForOwner: vi.fn(),
  deleteNiftyWatchDefinitionForOwner: vi.fn(),
  listNiftyAlertDefinitionsForOwner: vi.fn(),
  listNiftyWatchDefinitionsForOwner: vi.fn(),
}));

vi.mock("../db", () => mocks);
vi.mock("../_core/dataApi", () => ({ callDataApi: vi.fn() }));
import { marketRouter } from "./market";

const caller = (id: number) => marketRouter.createCaller({ user: { id } } as any);

describe("NIFTY informational alert definitions", () => {
  afterEach(() => vi.clearAllMocks());

  it("persists a daily-close threshold as a no-delivery informational alert", async () => {
    mocks.createNiftyAlertDefinitionForOwner.mockResolvedValue(21);
    await expect(caller(42).createAlert({ name: "Close movement notice", thresholdPercent: 1.5, timezone: "Asia/Kolkata" })).resolves.toEqual({ id: 21, deliveryState: "not_scheduled" });
    expect(mocks.createNiftyAlertDefinitionForOwner).toHaveBeenCalledWith(42, { name: "Close movement notice", thresholdBasisPoints: 150, timezone: "Asia/Kolkata" });
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "nifty_alert.created", detail: expect.stringContaining("delivery is not scheduled or enabled") }));
  });

  it("lists and removes alert definitions only through the authenticated owner scope", async () => {
    mocks.listNiftyAlertDefinitionsForOwner.mockResolvedValue([{ id: 21, deliveryState: "not_scheduled" }]);
    await expect(caller(72).alerts()).resolves.toEqual([{ id: 21, deliveryState: "not_scheduled" }]);
    expect(mocks.listNiftyAlertDefinitionsForOwner).toHaveBeenCalledWith(72);
    await caller(72).removeAlert({ id: 21 });
    expect(mocks.deleteNiftyAlertDefinitionForOwner).toHaveBeenCalledWith(72, 21);
  });
});
