import { describe, expect, it } from "vitest";

const describeLive =
  process.env.GITHUB_LIVE_TESTS === "true" ? describe : describe.skip;

describeLive("GitHub application credential", () => {
  it("authenticates against the current GitHub user endpoint", async () => {
    const token = process.env.GITHUB_TOKEN;
    expect(token, "GITHUB_TOKEN must be configured").toBeTruthy();

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
