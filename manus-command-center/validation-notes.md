# Validation Notes

## 2026-08-19 — Recurrence-Aware Schedules Route

The live `/schedules` control plane was visually verified at desktop (1280×720) and mobile (375×812) viewports. The route now presents the recurrence-aware definition panel, owner-scoped lifecycle panel, and preflight audit trail together. The selector exposes one-time, hourly, daily, weekly, monthly, cron, and event-driven modes. On both viewports, the paused-until-signed-idempotent-callback disclosure and empty-state boundaries remain legible and no action implies callback execution.

## 2026-08-20 — Workflow Graph and Scheduler Foundation

The graph-editor route was verified to load its owner-scoped empty state and clearly requires an existing workflow before an editable graph can be shown. A separate browser sign-in attempt is currently held at Google’s security-code challenge and therefore was not used to create verification data. The scheduler foundation now has a migrated `schedule_executions` history table, owner-scoped history queries, and an authenticated callback path that records idempotency outcomes while retaining the no-execution boundary. Type checking and 56 Vitest regressions pass.

## 2026-08-20 — Provider-Specific Deployment Controls

The live `/deployments` route was verified at desktop (1280×720) and mobile (375×812) viewports. GitHub displays its healthy credential-backed state separately from Vercel, Cloudflare, and Google Cloud, each of which has a distinct not-connected detail card that explains the exact missing provider mapping. The refresh action remains visible, and the layout preserves readable target details and capability boundaries at both breakpoints.

## 2026-08-20 — Logs and Workflow Trace

The combined `/logs` workspace was verified on desktop and mobile. The account-scoped audit interface retains its text search and outcome filters, while the new workflow trace section exposes a separate resilient loading, empty, and error boundary for run status, trigger source, retry count, and recorded errors. In the verified owner context, both collections correctly showed their empty states without suggesting execution activity.

## 2026-08-20 — Protected Engineering Audit

The command-center was fast-forwarded to the current private `main` branch before local audit repairs were reapplied. The GitHub credential probe is now explicitly opt-in through `GITHUB_LIVE_TESTS=true`, while mocked router tests provide their own non-secret credential context; this keeps the default suite hermetic without weakening the live validation path. A subsequent main-branch integration dropped the exported credential-management registry while retaining its contract test, so the official provider-management registry and returned link metadata were restored without embedding secrets. A frozen dependency install, TypeScript check, and the expanded Vitest suite completed successfully with 63 passing tests and one intentionally skipped opt-in credential probe. The production client build transformed all 6,302 modules but was repeatedly terminated by the constrained sandbox during final chunk rendering with exit code 143; no source, type, or test error was reported. This limitation remains documented rather than being hidden or worked around by changing production behavior.

## 2026-08-20 — Vercel Connector Scope

The configured Vercel connector was verified for read-only team and project discovery. Its currently visible project is a separate chatbot deployment rather than the AI Automation Command Center, so it was deliberately not mapped into the command-center deployment registry. The app therefore continues to show Vercel as not connected until a command-center-specific credential and project mapping are supplied.

## 2026-08-20 — CLI Authentication Verification

Antigravity CLI completed a fresh non-interactive terminal validation with the persisted Google OAuth profile and returned `READY`. Gemini CLI was restored at version 0.56.0; its saved profile completed a trusted, read-only terminal prompt and returned `READY`. GitHub CLI is authenticated as the active `balajirajput96` account and continues to be used for repository publication. A stale inactive GitHub profile remains invalid but does not affect the active account.

Jules does not have a locally installed CLI command in this environment. Its browser workspace reaches an explicit region-availability block rather than an interactive login prompt, so browser takeover cannot resolve the current Jules limitation. No credentials were changed or removed.

### Jules resolution

The official Jules Tools CLI was installed at version 0.1.42. After user-completed browser takeover, `jules login` returned a successful login confirmation. A follow-up read-only `jules remote list --repo` command returned the account’s connected GitHub repository inventory, confirming that the terminal OAuth session is persisted and usable even though the direct Jules web dashboard reports a regional availability limitation.
