import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addAuditEvent: vi.fn(),
  createNiftyWatchDefinitionForOwner: vi.fn(),
  deleteNiftyWatchDefinitionForOwner: vi.fn(),
  listNiftyWatchDefinitionsForOwner: vi.fn(),
}));

vi.mock("../db", () => mocks);
vi.mock("../_core/dataApi", () => ({ callDataApi: vi.fn() }));
import { marketRouter } from "./market";

const caller = (id: number) => marketRouter.createCaller({ user: { id } } as any);

describe("NIFTY watch definitions", () => {
  afterEach(() => vi.clearAllMocks());

  it("persists a bounded daily-close observation in basis points with a non-advisory audit record", async () => {
    mocks.createNiftyWatchDefinitionForOwner.mockResolvedValue(9);
    await expect(caller(42).createWatch({ name: "Daily observation", thresholdPercent: 1.25, timezone: "Asia/Kolkata" })).resolves.toEqual({ id: 9, scheduler: "not_configured" });
    expect(mocks.createNiftyWatchDefinitionForOwner).toHaveBeenCalledWith(42, { name: "Daily observation", thresholdBasisPoints: 125, timezone: "Asia/Kolkata" });
    expect(mocks.addAuditEvent).toHaveBeenCalledWith(42, expect.objectContaining({ action: "nifty_watch.created", outcome: "success", detail: expect.stringContaining("no alert delivery or trading action") }));
  });

  it("keeps definitions owner-scoped for list and removal", async () => {
    mocks.listNiftyWatchDefinitionsForOwner.mockResolvedValue([{ id: 3 }]);
    await expect(caller(77).watches()).resolves.toEqual([{ id: 3 }]);
    expect(mocks.listNiftyWatchDefinitionsForOwner).toHaveBeenCalledWith(77);
    await caller(77).removeWatch({ id: 3 });
    expect(mocks.deleteNiftyWatchDefinitionForOwner).toHaveBeenCalledWith(77, 3);
  });
});
