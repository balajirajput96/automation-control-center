import { describe, expect, it } from "vitest";

describe("GitHub application credential", () => {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    it.skip("authenticates against the current GitHub user endpoint when GITHUB_TOKEN is configured", () => {});
  } else {
    it("authenticates against the current GitHub user endpoint", async () => {

      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "ai-automation-command-center",
        },
      });

      expect(response.ok, `GitHub credential validation failed with ${response.status}`).toBe(true);
    }, 20_000);
  }
});
