import { afterEach, describe, expect, it, vi } from "vitest";
import { githubGet, githubReviewInput, mapGithubReviewRow } from "./github";

describe("GitHub review retrieval", () => {
  const originalToken = process.env.GITHUB_TOKEN;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalToken;
    }
  });

  it("validates review inputs and maps GitHub review responses into read-only fields", () => {
    expect(() =>
      githubReviewInput.parse({ repository: "invalid", pullNumber: 0 })
    ).toThrow();
    expect(
      mapGithubReviewRow(
        {
          id: 17,
          state: "APPROVED",
          user: { login: "reviewer" },
          submitted_at: "2026-08-17T00:00:00Z",
          body: "Looks good",
        },
        "owner/repo",
        4
      )
    ).toEqual({
      id: 17,
      state: "APPROVED",
      reviewer: "reviewer",
      submittedAt: "2026-08-17T00:00:00Z",
      body: "Looks good",
      url: "https://github.com/owner/repo/pull/4",
    });
  });

  it("surfaces upstream GitHub failures without turning them into review actions", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 })
    );
    await expect(
      githubGet("/repos/owner/repo/pulls/4/reviews?per_page=100")
    ).rejects.toThrow("GitHub request failed (503)");
  });
});
