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

  it("keeps every sensitive action approval-gated across all autonomy levels", () => {
    for (const level of ["manual", "assisted", "autonomous"] as const) {
      for (const action of ["publish", "deploy", "delete", "credential_change"] as const) {
        expect(evaluateExecutionPolicy(level, action).decision).toBe("needs_approval");
      }
    }
  });

  it("allows only low-risk work to bypass review for Autonomous agents", () => {
    expect(evaluateExecutionPolicy("autonomous", "plan").decision).toBe("allowed");
    expect(evaluateExecutionPolicy("autonomous", "generate_content").decision).toBe("allowed");
    expect(evaluateExecutionPolicy("autonomous", "credential_change").decision).toBe("needs_approval");
  });
});
