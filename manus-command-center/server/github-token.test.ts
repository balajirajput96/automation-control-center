import { describe, expect, it } from "vitest";

describe("GitHub application credential", () => {
  it("authenticates against the current GitHub user endpoint", async () => {
    const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
    expect(token, "GITHUB_TOKEN or GH_TOKEN must be configured").toBeTruthy();

    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "ai-automation-command-center",
      },
    });

    expect(
      response.ok,
      `GitHub credential validation failed with ${response.status}`
    ).toBe(true);
  }, 20_000);
});
