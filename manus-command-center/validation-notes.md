# Validation Notes

## 2026-08-19 — Recurrence-Aware Schedules Route

The live `/schedules` control plane was visually verified at desktop (1280×720) and mobile (375×812) viewports. The route now presents the recurrence-aware definition panel, owner-scoped lifecycle panel, and preflight audit trail together. The selector exposes one-time, hourly, daily, weekly, monthly, cron, and event-driven modes. On both viewports, the paused-until-signed-idempotent-callback disclosure and empty-state boundaries remain legible and no action implies callback execution.

## 2026-08-20 — Workflow Graph and Scheduler Foundation

The graph-editor route was verified to load its owner-scoped empty state and clearly requires an existing workflow before an editable graph can be shown. A separate browser sign-in attempt is currently held at Google’s security-code challenge and therefore was not used to create verification data. The scheduler foundation now has a migrated `schedule_executions` history table, owner-scoped history queries, and an authenticated callback path that records idempotency outcomes while retaining the no-execution boundary. Type checking and 56 Vitest regressions pass.

## 2026-08-20 — Provider-Specific Deployment Controls

The live `/deployments` route was verified at desktop (1280×720) and mobile (375×812) viewports. GitHub displays its healthy credential-backed state separately from Vercel, Cloudflare, and Google Cloud, each of which has a distinct not-connected detail card that explains the exact missing provider mapping. The refresh action remains visible, and the layout preserves readable target details and capability boundaries at both breakpoints.

## 2026-08-20 — Logs and Workflow Trace

The combined `/logs` workspace was verified on desktop and mobile. The account-scoped audit interface retains its text search and outcome filters, while the new workflow trace section exposes a separate resilient loading, empty, and error boundary for run status, trigger source, retry count, and recorded errors. In the verified owner context, both collections correctly showed their empty states without suggesting execution activity.
