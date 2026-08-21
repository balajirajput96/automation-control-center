import { describe, expect, it } from "vitest";
import { checkCloudflareHealth, checkGoogleCloudHealth, checkVercelHealth } from "./providerHealth";

const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));

describe("credential-ready provider health adapters", () => {
  it("keeps each provider explicitly unavailable without complete scoped mapping", async () => {
    await expect(checkVercelHealth({}, async () => ok({}))).resolves.toMatchObject({ connectionStatus: "action_required", targetStatus: "not_connected" });
    await expect(checkCloudflareHealth({ CLOUDFLARE_API_TOKEN: "token" }, async () => ok({}))).resolves.toMatchObject({ connectionStatus: "action_required", targetStatus: "not_connected" });
    await expect(checkGoogleCloudHealth({ GOOGLE_CLOUD_PROJECT_ID: "project" }, async () => ok({}))).resolves.toMatchObject({ connectionStatus: "action_required", targetStatus: "not_connected" });
  });

  it("uses scoped mapped endpoint checks without exposing raw credentials", async () => {
    const vercel = await checkVercelHealth({ VERCEL_API_TOKEN: "secret", VERCEL_PROJECT_ID: "command-center", VERCEL_TEAM_ID: "team" }, async (url, init) => { expect(url).toContain("command-center"); expect(init?.headers).toEqual({ Authorization: "Bearer secret" }); return ok({ name: "command-center" }); });
    const cloudflare = await checkCloudflareHealth({ CLOUDFLARE_API_TOKEN: "secret", CLOUDFLARE_ACCOUNT_ID: "account", CLOUDFLARE_WORKER_NAME: "command-center" }, async (url) => { expect(url).toContain("workers/scripts/command-center"); return ok({ success: true }); });
    const google = await checkGoogleCloudHealth({ GOOGLE_CLOUD_ACCESS_TOKEN: "secret", GOOGLE_CLOUD_PROJECT_ID: "command-center" }, async (url, init) => { expect(url).toContain("projects/command-center"); expect(init?.headers).toEqual({ Authorization: "Bearer secret" }); return ok({ projectId: "command-center" }); });
    expect([vercel, cloudflare, google]).toEqual(expect.arrayContaining([expect.objectContaining({ connectionStatus: "connected", targetStatus: "healthy" })]));
  });
});
