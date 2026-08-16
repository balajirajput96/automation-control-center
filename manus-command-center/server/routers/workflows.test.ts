import { describe, expect, it } from "vitest";
import { isSixFieldCron, validateWorkflowDefinition } from "./workflows";

describe("workflow definition validation", () => {
  it("accepts a trigger followed by an agent", () => {
    expect(validateWorkflowDefinition({ nodes: [{ id: "trigger", type: "trigger", label: "Start", config: {} }, { id: "agent", type: "agent", label: "Research", config: {} }], edges: [{ id: "edge", source: "trigger", target: "agent" }] }).state).toBe("valid");
  });

  it("rejects missing trigger nodes and bad edges", () => {
    expect(validateWorkflowDefinition({ nodes: [{ id: "agent", type: "agent", label: "Research", config: {} }], edges: [] }).state).toBe("invalid");
    expect(validateWorkflowDefinition({ nodes: [{ id: "trigger", type: "trigger", label: "Start", config: {} }], edges: [{ id: "edge", source: "trigger", target: "missing" }] }).state).toBe("invalid");
  });

  it("requires six fields for persisted cron definitions", () => {
    expect(isSixFieldCron("0 0 9 * * *")).toBe(true);
    expect(isSixFieldCron("0 9 * * *")).toBe(false);
  });
});
