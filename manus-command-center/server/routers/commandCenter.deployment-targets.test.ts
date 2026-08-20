import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureIntegrationRegistry: vi.fn(),
  getCommandCenterSnapshot: vi.fn(),
  listDeploymentTargetsForOwner: vi.fn(),
  listIntegrationsForOwner: vi.fn(),
  searchAuditEventsForOwner: vi.fn(),
  updateDeploymentTargetHealth: vi.fn(),
  updateIntegrationHealth: vi.fn(),
  listLLMModels: vi.fn(),
}));

vi.mock("../db", () => mocks);
vi.mock("../_core/llm", () => ({ listLLMModels: mocks.listLLMModels }));

import { commandCenterRouter } from "./commandCenter";

function caller(ownerId = 42) {
  return commandCenterRouter.createCaller({ user: { id: ownerId } } as any);
}

describe("deployment target state surfaces", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    delete process.env.GITHUB_TOKEN;
  });

  it("returns owner-scoped healthy and not-connected deployment targets unchanged for exact provider detail rendering", async () => {
    const targets = [
      { id: 1, ownerId: 42, provider: "github", name: "GitHub source control", status: "healthy", metadata: { detail: "Credential-backed GitHub verification succeeded." } },
      { id: 2, ownerId: 42, provider: "vercel", name: "Vercel production", status: "not_connected", metadata: null },
      { id: 3, ownerId: 42, provider: "cloudflare", name: "Cloudflare edge", status: "not_connected", metadata: null },
      { id: 4, ownerId: 42, provider: "google_cloud", name: "Google Cloud runtime", status: "not_connected", metadata: null },
    ];
    mocks.listDeploymentTargetsForOwner.mockResolvedValue(targets);

    await expect(caller().deploymentTargets()).resolves.toEqual(targets);
    expect(mocks.listDeploymentTargetsForOwner).toHaveBeenCalledWith(42);
  });

  it("records unavailable provider boundaries during refresh when credentials are not configured", async () => {
    mocks.listLLMModels.mockResolvedValue({ data: [] });
    mocks.listIntegrationsForOwner.mockResolvedValue([]);

    await caller().integrationHealth();

    expect(mocks.updateIntegrationHealth).toHaveBeenCalledWith(42, "vercel", expect.objectContaining({ connectionStatus: "action_required", lastError: expect.stringContaining("not configured") }));
    expect(mocks.updateIntegrationHealth).toHaveBeenCalledWith(42, "cloudflare", expect.objectContaining({ connectionStatus: "action_required", lastError: expect.stringContaining("not configured") }));
    expect(mocks.updateIntegrationHealth).toHaveBeenCalledWith(42, "google_cloud", expect.objectContaining({ connectionStatus: "action_required", lastError: expect.stringContaining("not configured") }));
    expect(mocks.updateDeploymentTargetHealth).not.toHaveBeenCalledWith(42, "github", expect.anything());
  });
});
