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

  it("rejects duplicate identifiers and self-referencing graph edges", () => {
    expect(validateWorkflowDefinition({ nodes: [{ id: "trigger", type: "trigger", label: "Start", config: {} }, { id: "trigger", type: "agent", label: "Duplicate", config: {} }], edges: [] }).state).toBe("invalid");
    expect(validateWorkflowDefinition({ nodes: [{ id: "trigger", type: "trigger", label: "Start", config: {} }, { id: "agent", type: "agent", label: "Research", config: {} }], edges: [{ id: "edge", source: "agent", target: "agent" }] }).state).toBe("invalid");
  });

  it("rejects implicit cycles but keeps explicit loop nodes reviewable", () => {
    expect(validateWorkflowDefinition({ nodes: [{ id: "trigger", type: "trigger", label: "Start", config: {} }, { id: "agent", type: "agent", label: "Research", config: {} }, { id: "approval", type: "approval", label: "Review", config: {} }], edges: [{ id: "a", source: "trigger", target: "agent" }, { id: "b", source: "agent", target: "approval" }, { id: "c", source: "approval", target: "agent" }] }).state).toBe("invalid");
    expect(validateWorkflowDefinition({ nodes: [{ id: "trigger", type: "trigger", label: "Start", config: {} }, { id: "loop", type: "loop", label: "Repeat", config: {} }], edges: [{ id: "a", source: "trigger", target: "loop" }, { id: "b", source: "loop", target: "trigger" }] }).state).toBe("warning");
  });

  it("requires six fields for persisted cron definitions", () => {
    expect(isSixFieldCron("0 0 9 * * *")).toBe(true);
    expect(isSixFieldCron("0 9 * * *")).toBe(false);
  });
});
