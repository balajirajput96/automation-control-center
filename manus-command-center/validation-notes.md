# Validation Notes

## 2026-08-19 — Recurrence-Aware Schedules Route

The live `/schedules` control plane was visually verified at desktop (1280×720) and mobile (375×812) viewports. The route now presents the recurrence-aware definition panel, owner-scoped lifecycle panel, and preflight audit trail together. The selector exposes one-time, hourly, daily, weekly, monthly, cron, and event-driven modes. On both viewports, the paused-until-signed-idempotent-callback disclosure and empty-state boundaries remain legible and no action implies callback execution.

## 2026-08-20 — Workflow Graph and Scheduler Foundation

The graph-editor route was verified to load its owner-scoped empty state and clearly requires an existing workflow before an editable graph can be shown. A separate browser sign-in attempt is currently held at Google’s security-code challenge and therefore was not used to create verification data. The scheduler foundation now has a migrated `schedule_executions` history table, owner-scoped history queries, and an authenticated callback path that records idempotency outcomes while retaining the no-execution boundary. Type checking and 56 Vitest regressions pass.
