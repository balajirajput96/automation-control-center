# Validation Notes

## 2026-08-19 — Recurrence-Aware Schedules Route

The live `/schedules` control plane was visually verified at desktop (1280×720) and mobile (375×812) viewports. The route now presents the recurrence-aware definition panel, owner-scoped lifecycle panel, and preflight audit trail together. The selector exposes one-time, hourly, daily, weekly, monthly, cron, and event-driven modes. On both viewports, the paused-until-signed-idempotent-callback disclosure and empty-state boundaries remain legible and no action implies callback execution.

## 2026-08-20 — Workflow Graph and Scheduler Foundation

The graph-editor route was verified to load its owner-scoped empty state and clearly requires an existing workflow before an editable graph can be shown. A separate browser sign-in attempt is currently held at Google’s security-code challenge and therefore was not used to create verification data. The scheduler foundation now has a migrated `schedule_executions` history table, owner-scoped history queries, and an authenticated callback path that records idempotency outcomes while retaining the no-execution boundary. Type checking and 56 Vitest regressions pass.

## 2026-08-20 — Provider-Specific Deployment Controls

The live `/deployments` route was verified at desktop (1280×720) and mobile (375×812) viewports. GitHub displays its healthy credential-backed state separately from Vercel, Cloudflare, and Google Cloud, each of which has a distinct not-connected detail card that explains the exact missing provider mapping. The refresh action remains visible, and the layout preserves readable target details and capability boundaries at both breakpoints.

## 2026-08-20 — Logs and Workflow Trace

The combined `/logs` workspace was verified on desktop and mobile. The account-scoped audit interface retains its text search and outcome filters, while the new workflow trace section exposes a separate resilient loading, empty, and error boundary for run status, trigger source, retry count, and recorded errors. In the verified owner context, both collections correctly showed their empty states without suggesting execution activity.

## 2026-08-20 — Vercel Connector Scope

The configured Vercel connector was verified for read-only team and project discovery. Its currently visible project is a separate chatbot deployment rather than the AI Automation Command Center, so it was deliberately not mapped into the command-center deployment registry. The app therefore continues to show Vercel as not connected until a command-center-specific credential and project mapping are supplied.

## 2026-08-20 — CLI Authentication Verification

Antigravity CLI completed a fresh non-interactive terminal validation with the persisted Google OAuth profile and returned `READY`. Gemini CLI was restored at version 0.56.0; its saved profile completed a trusted, read-only terminal prompt and returned `READY`. GitHub CLI is authenticated as the active `balajirajput96` account and continues to be used for repository publication. A stale inactive GitHub profile remains invalid but does not affect the active account.

Jules does not have a locally installed CLI command in this environment. Its browser workspace reaches an explicit region-availability block rather than an interactive login prompt, so browser takeover cannot resolve the current Jules limitation. No credentials were changed or removed.

### Jules resolution

The official Jules Tools CLI was installed at version 0.1.42. After user-completed browser takeover, `jules login` returned a successful login confirmation. A follow-up read-only `jules remote list --repo` command returned the account’s connected GitHub repository inventory, confirming that the terminal OAuth session is persisted and usable even though the direct Jules web dashboard reports a regional availability limitation.

## 2026-08-20 — Live Content Route Check

An authenticated browser check of the deployed `/content` route reached the application shell but remained blank after the initial load window. This differs from the managed development preview, where the owner-scoped content empty state renders. No content data was created or altered; populated-state capture remains pending until the live session and deployment route render normally.

### Authenticated retry

After completing the Command Center sign-in, the live `/content` route rendered the owner-scoped Content Studio and its new-project control correctly. The earlier blank state was an unauthenticated session presentation, not a deployed application defect.

An owner-scoped internal verification dossier was prepared through the live Content Studio form to support non-simulated populated-state coverage. Its persistence result is being verified separately before any associated source, artifact, citation, or export record is created.

### Populated project verification

The owner-scoped verification dossier persisted successfully and rendered on the live Content Studio route. The live Research Studio automatically selected the same content project and exposed source-record creation with a visible empty state, establishing the source-to-project association path for populated-state coverage.

The dossier source form was populated with the official Jules Tools CLI reference, classified as established evidence and labeled as official product documentation. Source-record persistence is being verified separately before downstream citation or export records are created.

### Persisted source

The official Jules Tools CLI source persisted successfully and rendered as an established, owner-scoped research card with its original URL, documentation type, and explanatory notes. This provides a real source record for the live content-artifact and citation paths.

The live Content Artifact workspace successfully loaded the same owner-scoped dossier and exposed its outline, script, storyboard, metadata-tag, export-note, lifecycle, and save controls. No artifact content was persisted before these fields were explicitly prepared.

The dossier’s source-backed outline, script, storyboard, metadata tags, and internal-only export notes were saved through the live owner-scoped artifact workspace. The record continues to state that no public publication, delivery, or renderer action is authorized.

The live Citation Editor confirmed that the persisted dossier is available for owner-scoped citation edits, while the Citations & exports workspace exposed section attribution and ready-export history controls for the same project. No citation or export record was created before the associated source-backed text was prepared.

The citation form was prepared with the script-section claim that Jules Tools uses Google authentication and supports remote repository/session commands. Its source text is the official Jules Tools Reference at https://jules.google/docs/cli/reference/ (accessed 2026-08-20); persistence is confirmed separately before any export history entry is added.

The script-section citation persisted successfully and rendered in the dossier’s live owner-scoped citation history. An internal-only export history entry was then prepared with the format `markdown verification record` and destination `internal-audit / not-published`; it remains a record of readiness rather than a publication or delivery action.

The ready export history entry persisted successfully. The live interface explicitly confirmed: “Export history recorded; no publication was triggered,” and rendered the record as `ready · markdown verification record · internal-audit / not-published`.

## 2026-08-20 — Vertical-Video Pipeline Workspace

The authenticated live vertical-video asset-plan workspace loaded the same owner-scoped verification dossier and exposed optional managed source, thumbnail, and output slots alongside selectable clipping, silence-removal, captions, voice-over, subtitles, and 9:16-conversion operations. The interface explicitly states that saving stores a plan only and does not invoke rendering, export, delivery, or publishing.

For the internal verification dossier, the non-rendering plan title `Verification Dossier — 9:16 Review Plan` was prepared with selectable clipping, silence removal, captions, voice-over, subtitles, and 9:16 conversion controls. It intentionally has no managed source, thumbnail, or output asset references because no real video assets have been supplied.

The non-rendering save action was submitted and the configured title and operation selections remained visible. The persisted job and readiness display are being verified on the Video Studio route; no rendering, publishing, or delivery action has been requested.

The subsequent Video Studio check rendered its expected empty-state boundary and no video job. The asset-plan form requires only a selected project and title, so the missing persisted job is being diagnosed before the pipeline visual-verification task is marked complete.

### Hydrated job verification

A direct authenticated `video.list` response returned the persisted draft job with its owner scope, content-project association, no asset references, explicit external-render boundary, and selected edit-plan data. After client-query hydration completed, the live Video Studio rendered the `Verification Dossier — 9:16 Review Plan` draft card with all six pipeline-operation labels and a review-only `Request handoff` control. No renderer, publication, or delivery action was invoked.

### Exact saved-state badges

The job and readiness views now render the saved edit-plan values as explicit ON/OFF badges rather than generic labels. The populated verification plan visibly shows ON for clipping, silence removal, voice-over, subtitles, and 9:16 conversion, and OFF for captions, matching the persisted `editPlan`. Type checking and 62 Vitest tests passed, including the new pure formatter regression. Desktop full-page checks confirmed the same values on both the Video Studio route and the readiness review.

The first live deployment check continued to serve the pre-update Video Studio bundle: the authenticated job hydrated successfully, but the new persisted-state section and ON/OFF text were absent. The post-checkpoint client cache/deployment propagation is being refreshed before final live DOM verification; the deployed data itself remains available and correct.

Hard refresh and a checkpoint-version query parameter continued to receive the same pre-update client bundle hash. The next deployment verification will wait for the autoscale edge to present the current checkpoint rather than treating the stale browser response as proof against the tested implementation.

The fresh `f17e5095` deployment then hydrated the populated Video Studio route with the new `PERSISTED PIPELINE STATE` panel. Its live DOM explicitly contained `ON Clipping`, `ON Silence removal`, `OFF Captions`, `ON Voice-over`, `ON Subtitles`, and `ON 9:16 conversion` for the saved verification plan, matching the stored edit plan exactly.

The fresh deployed Video Readiness route also rendered the populated plan with the same visible ON/OFF badges and retained the explicit boundary that readiness controls do not render, export, deliver, or publish video. The browser text extractor concatenates adjacent badge spans (for example, `ONClipping`), while the rendered labels and the UI regression prove the intended ON/OFF state mapping.

## Workflow approval queue verification

An owner-scoped `Approval Queue Verification Workflow` was created with a manual trigger and a two-node valid graph. Its internal-only request created run `#1` in the `needs_approval` state without invoking an adapter. After the queue cache-invalidation repair, the fresh deployed Workflows route visibly rendered the populated run with both Approve and Deny controls. Approving it removed the record from the pending queue and left it as a queued authorization only; no external execution was started.

## Agent dispatch history verification

An owner-scoped Assisted agent policy was created for internal research verification with explicit no-external-adapter instructions. A low-risk research request generated a persisted `agent_dispatch.requested` audit record. The fresh deployed Agents route rendered that record in the dispatch-history panel after hydration, confirming the history is owner-scoped, persists across refresh, and displays its requested outcome without triggering any adapter.

An explicit high-impact publish request was then recorded solely for approval-control verification. The deployed Agents view displayed the required Approve and Deny controls. Approving the request transitioned its inline status to `approved · audit event recorded`; the interface contract and recorded task both confirm that no publish, delivery, or external adapter invocation occurred.

A second internal workflow run request was retained in `needs_approval` for responsive verification. Desktop and true 375px mobile captures both showed its distinct Approve and Deny controls without overlap or clipping. The mobile Agents capture simultaneously showed the persisted requested and approved dispatch history states.

For the outstanding mobile dispatch-control proof, the fresh Agents route rehydrated the same owner-scoped agent and history after its initial loading boundary. The existing pending and approved audit entries remained visible; a new pending high-impact request is being created solely to capture the inline mobile Approve/Deny controls before resolution.

The true mobile capture then displayed the high-impact review-only dispatch with distinct Approve and Deny controls, no clipping, and the explicit no-external-action boundary. Denying the verification request transitioned its inline state to `denied · audit event recorded` and added the persisted denied audit row. Workflow and dispatch resolution controls are now verified on both desktop and mobile while all related verification requests remain non-executing.

## 2026-08-20 — Populated managed vertical-video slot verification

With the user-confirmed internal-only blueprint specification, a five-second 720×1280 clip and a matching 9:16 thumbnail were generated for controlled validation only. The managed media records were associated with the existing owner-scoped verification dossier as source video, thumbnail, and review-output video. The persisted vertical job `Internal verification — managed vertical slots` stores `sourceAssetId #1`, `thumbnailAssetId #2`, `outputAssetId #3`, and strict owner-scoped storage metadata.

The live desktop readiness route exposed all three slot references, the `owner_scoped_managed_asset` attachment mode, stored operation notes, exact ON badges, and its no-rendering boundary. A fixed 375px mobile capture showed the same metadata and controls without clipping. No render, export, delivery, publication, or external adapter invocation occurred.

## 2026-08-20 — Global resilient-state audit

A static audit confirmed that every client module using data queries includes a loading, empty, error, pending, or authentication boundary. The authenticated shell supplies a clear sign-in state for missing sessions; all protected data is owner scoped at the server layer. A representative desktop sweep covered Dashboard, Agents, Workflows, Video Readiness, Schedules, Deployments, Logs, and Content Studio. A matching fixed 375px mobile sweep confirmed readable loading/empty boundaries, approval controls, content cards, explicit provider-unavailable states, and non-rendering video controls without clipping.

The complete route-by-route boundary inventory is recorded in `resilience-audit.md`. It maps every implemented route family to its primary loading, empty, error, authorization, or protected-procedure boundary. No query-consuming `.tsx` file lacked a corresponding explicit resilient-state signal in the static audit.

The standard Vitest suite now enforces this inventory: all 26 query-consuming client modules must retain an explicit loading, empty, error, pending, or authentication signal, while the resilience audit must continue to cover the key route families and authorization boundary. The resulting type check and full test run passed with 79 tests.

### Full responsive module verification

Every documented page surface was captured at both 1280px desktop and fixed 375px mobile widths: Dashboard, Chat, Agents, Projects, Workflows, Content, Video, Image Studio, Media Library, Research, Schedules, Maintenance, Deployments, Integrations, Logs, and NIFTY. The captures showed parent-provided components within their documented surfaces: sidebar/authentication shell, loading/empty cards, approval controls, video readiness, content records, schedule controls, maintenance history, provider-unavailable cards, audit traces, and the informational market view. No horizontal clipping, missing parent boundary, or illegible mobile control was found. Static custom modules that intentionally inherit a parent-provided state boundary are identified individually in `resilience-audit.md`; their responsive behavior is covered by the captured parent surface.

The direct wrapper-route capture set then covered Content Artifacts, Content Records, Citation Editor, Asset-linked Exports, Schedule Definitions, Schedule Lifecycle, Video Asset Plan, Video Readiness, Project Activity, Workflow Definition Editor, both approval routes, GitHub Details, Settings, the explicit `/404` route, and an unknown-route fallback. Both desktop and 375px captures rendered their documented loading, empty, validation, or fallback boundaries without overlap. The 375px direct captures explicitly showed the editable workflow canvas, populated approval buttons, GitHub selection empty state, and the deterministic 404 fallback. These route artifacts complete the parent-surface evidence referenced by the custom-module responsive ledger.

The standalone generic `MapView` component now has its own explicit loading state and an accessible unavailable-state fallback when the authorized map provider cannot initialize. The source boundary is enforced by the resilience test suite alongside the complete custom-module inventory; the latest full type check and test suite passed with 82 tests.

The internal Boundary Verification gallery provided direct desktop and 375px evidence for `DashboardLayoutSkeleton`, `VideoPipelineOperationBadges`, `WorkflowCanvas`, and `MapView`. The Map component reached its documented unavailable boundary safely. A deterministic `BoundaryDialog` route additionally captured the fixed Manus authentication dialog in both desktop and 375px viewport-only screenshots, including its readable close control and login action. The remaining custom visual elements are covered by their named parent surfaces in the responsive ledger.

The published production Boundary Verification route was also loaded in an authenticated browser after checkpoint `dd9ac799`. It rendered the shell-loading skeleton, exact pipeline badges, graph controls, and an authorized live map successfully. This confirms that the standalone Map component handles both its verified local unavailable state and an available production provider state without affecting Command Center write permissions.

The latest read-only maintenance health readback confirms the enabled bounded plan remains on its original authenticated hourly task UID with `1 / 2400` completed cycles. Its most recent cycle is `completed` and retains the expected hourly idempotency key; no duplicate or external-operation record was observed.

The verified Command Center source was synchronized to the approved `balajirajput96/automation-control-center` repository on `main` at commit `1e094f0` after rebasing remote changes and preserving the validated dependency lock. No external deployment action was performed by this GitHub synchronization.

## 2026-08-20 — Credential-ready provider health adapters

The deployment health router now contains scoped, credential-ready read-only adapters for Vercel, Cloudflare Workers, and Google Cloud projects. Each adapter remains `not_connected` with an explicit mapping requirement until the relevant project-level credential and target identifier are supplied. Unit coverage verifies both unavailable and healthy mapped paths without persisting or printing a raw provider credential. The protected health router converts these results into integration and deployment target state only; it does not deploy, mutate DNS, publish, or modify cloud resources.

## 2026-08-22 — Daily read-only Command Center review

The active daily review retains the user-supplied read-only playbook, runs at 09:00 Asia/Kolkata, and now carries only the explicitly authorized GitHub, Google Gemini, and Google Workspace connector scope. The schedule is active, uses the existing task context, and prohibits publishing, merging, deleting, deployments, credential changes, account creation, spending, external messages, and irreversible actions. Its instructions also require the run to report a service as unavailable rather than claiming access when a connector is absent.

## 2026-08-22 — Maintenance route deployment check

Immediately after checkpoint `94eea947`, the authenticated production browser still served the preceding route bundle: the new Maintenance navigation item and `/maintenance` route were not present, returning the existing not-found boundary. This was recorded as deployment propagation rather than a route failure; a fresh published-bundle check is required before creating the first maintenance plan.

## 2026-08-22 — Bounded hourly maintenance service

The owner-scoped `Command Center bounded maintenance` plan was created with a hard maximum of 2,400 hourly cycles. It is bound to the enabled project-owner Heartbeat task `mSjYyVRpxGzWHuCWhKXYDq`, which posts only to `/api/scheduled/maintenance-cycle` on the six-field hourly UTC expression `0 0 * * * *`.

The callback performs owner-scoped, idempotent, read-only state collection: pending workflow approvals, pending dispatch approvals, deployment target state, and integration attention state. It cannot invoke a repository write, merge, deployment, publishing action, external message, credential change, deletion, purchase, or account creation. The platform job configuration and the database task UID mapping were both verified after creation.

The deployed production `/maintenance` route subsequently propagated and was verified in an authenticated browser. It visibly rendered the bounded plan, `0 / 2400 cycles`, hourly interval, and `Callback bound` status together with the explicit non-destructive operating boundary. The cycle history correctly remains empty until the first authenticated scheduled callback succeeds.

### First authenticated cycle proof

The bound authenticated callback subsequently completed at 21:42:16 UTC and persisted maintenance cycle #1. It advanced the plan to `1 / 2400 cycles`, recorded one pending workflow approval, one pending dispatch approval, three deployment targets needing attention, and five integrations needing attention. The corresponding `maintenance_cycle.completed` owner-scoped audit event was also persisted with a success outcome and the idempotency key. The deployed production Maintenance page was then rechecked and visibly rendered the populated completed cycle in its history. The callback only collected and recorded this state; it made no external mutation.

An additional final review-only pending-dispatch capture is being prepared specifically for a confirmed 375px browser screenshot before any resolution. The Agents route rehydrated the owner-scoped policy and prior requested, approved, and denied history records correctly after the initial loading boundary.

### Refresh-safe dispatch approval proof

The new persisted `agent_dispatches` record was created through the fresh deployed route, and the owner-scoped `agents.dispatches` endpoint returned it as `needs_approval` after a full route reload. The same reload visibly rehydrated its Approve and Deny controls. A fixed 375px mobile screenshot then showed those controls in the governed-dispatch card alongside the persisted history, without clipping or overlap. This is the final mobile proof for refresh-safe dispatch approvals; no publishing, delivery, or external adapter action occurred.
