import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("GitHub pull-request review contract", () => {
  it("keeps review visibility read-only and scoped to an explicit pull request", () => {
    const source = readFileSync(
      new URL("./routers/github.ts", import.meta.url),
      "utf8"
    );
    expect(source).toMatch(
      /reviews:\s*protectedProcedure\s*\.input\(githubReviewInput\)/
    );
    expect(source).toContain("/pulls/${input.pullNumber}/reviews?per_page=100");
    expect(source).toContain('state: String(row.state || "PENDING")');
    expect(source).not.toContain("POST /repos/");
    expect(source).not.toContain("PATCH /repos/");
  });
});
