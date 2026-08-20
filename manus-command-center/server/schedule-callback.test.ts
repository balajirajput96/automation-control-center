import { describe, expect, it } from "vitest";
import { createScheduleCallbackIdempotencyKey, getScheduledCallbackStatus } from "./db";

describe("scheduled callback guardrails", () => {
  it("uses the cron task UID and UTC minute window for deterministic retry idempotency", () => {
    const first = createScheduleCallbackIdempotencyKey("task-42", new Date("2026-08-20T09:00:15.000Z"));
    const retry = createScheduleCallbackIdempotencyKey("task-42", new Date("2026-08-20T09:00:55.000Z"));
    const nextWindow = createScheduleCallbackIdempotencyKey("task-42", new Date("2026-08-20T09:01:00.000Z"));
    expect(first).toBe("task-42:2026-08-20T09:00");
    expect(retry).toBe(first);
    expect(nextWindow).not.toBe(first);
  });

  it("records receipt as blocked only for an active schedule and otherwise skips it without execution", () => {
    expect(getScheduledCallbackStatus("active")).toBe("blocked");
    expect(getScheduledCallbackStatus("paused")).toBe("skipped");
    expect(getScheduledCallbackStatus("failed")).toBe("skipped");
    expect(getScheduledCallbackStatus("completed")).toBe("skipped");
  });
});
