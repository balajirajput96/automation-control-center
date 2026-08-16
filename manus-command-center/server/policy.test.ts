import { describe, expect, it } from "vitest";
import { evaluateExecutionPolicy } from "./policy";

describe("evaluateExecutionPolicy", () => {
  it("requires approval for every Manual action", () => {
    expect(evaluateExecutionPolicy("manual", "research").decision).toBe("needs_approval");
  });

  it("permits low-risk Assisted work but stops deployment", () => {
    expect(evaluateExecutionPolicy("assisted", "generate_content").decision).toBe("allowed");
    expect(evaluateExecutionPolicy("assisted", "deploy").decision).toBe("needs_approval");
  });

  it("keeps high-impact Autonomous actions behind approval", () => {
    expect(evaluateExecutionPolicy("autonomous", "research").decision).toBe("allowed");
    expect(evaluateExecutionPolicy("autonomous", "delete").decision).toBe("needs_approval");
  });
});
