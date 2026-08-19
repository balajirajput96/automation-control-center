import { afterEach, describe, expect, it, vi } from "vitest";
import { githubRouter } from "./github";

const caller = () => githubRouter.createCaller({ user: { id: 1 } } as any);
const originalToken = process.env.GITHUB_TOKEN;

describe("githubRouter.reviews", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = originalToken;
  });

  it("retrieves and maps an authorized read-only review response", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 7, state: "APPROVED", user: { login: "maintainer" }, submitted_at: "2026-08-17T00:00:00Z", body: "Approved after review", html_url: "https://github.com/owner/repo/pull/4#pullrequestreview-7" }] });
    vi.stubGlobal("fetch", fetchMock);
    await expect(caller().reviews({ repository: "owner/repo", pullNumber: 4 })).resolves.toEqual([{ id: 7, state: "APPROVED", reviewer: "maintainer", submittedAt: "2026-08-17T00:00:00Z", body: "Approved after review", url: "https://github.com/owner/repo/pull/4#pullrequestreview-7" }]);
    expect(fetchMock).toHaveBeenCalledWith("https://api.github.com/repos/owner/repo/pulls/4/reviews?per_page=100", expect.any(Object));
  });

  it("rejects invalid review inputs through the protected procedure", async () => {
    await expect(caller().reviews({ repository: "invalid", pullNumber: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("surfaces upstream failures without performing a write action", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 502 });
    vi.stubGlobal("fetch", fetchMock);
    await expect(caller().reviews({ repository: "owner/repo", pullNumber: 4 })).rejects.toThrow("GitHub request failed (502)");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
