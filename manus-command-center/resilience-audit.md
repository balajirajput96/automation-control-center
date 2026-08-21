# Command Center Resilience Audit

**Scope.** This audit records the client-visible loading, empty, error, and authorization boundary for each implemented route family. It is grounded in the current route inventory in `client/src/App.tsx`, the shared authenticated shell, and a static audit of every `.tsx` file that calls `useQuery`. That audit found no query-consuming client file without at least one explicit loading, empty, error, pending, or authentication boundary.

| Route family | Primary surface | Loading and empty boundary | Error and authorization boundary |
|---|---|---|---|
| `/` | Dashboard | Metric and activity cards use skeletons, zero-count states, and verified/unavailable integration cards. | `DashboardLayout` supplies the sign-in gate; `ErrorBoundary` catches unexpected render failure. |
| `/chat` | AI Chat | Empty conversation prompts and sending state are visible in `AIChatBox`. | Provider and route errors are surfaced by the page and mutation feedback; unauthenticated users see the shell sign-in gate. |
| `/agents` | Agents and dispatches | Agent cards, persisted dispatch history, and resolution controls use empty and loading panels. | Owner-scoped dispatch and policy operations display error feedback; protected layout handles sign-in. |
| `/projects` and `/projects/activity` | Projects and activity | Empty project/activity panels and loading cards are explicit. | Owner-only server procedures reject cross-owner access; page-level query errors are shown. |
| `/workflows`, `/workflow-definition-editor`, `/workflow-approvals`, `/run-approvals` | Workflows and approval queue | Workflow, graph, and run-queue empty states are explicit; request/resolve controls expose pending state. | Query and mutation failures display guarded feedback; approval remains non-executing. |
| `/schedules`, `/schedule-definitions`, `/schedule-lifecycle` | Scheduler controls | Definition, lifecycle, preflight, and callback-history sections each show loading and empty states. | Invalid recurrence input is explained; errors are visible and activation stays blocked behind signed/idempotent prerequisites. |
| `/content`, `/research`, `/content-artifacts`, `/content-records`, `/citation-editor`, `/content-export-assets` | Content production record | Owner-scoped project selectors and record lists include empty-state guidance and in-progress controls. | Source, citation, export, and cross-owner failures are displayed through query/mutation feedback. |
| `/images`, `/media`, `/video`, `/video-asset-plan`, `/video-readiness` | Managed media and video review | Model/asset/job lists use empty, loading, and disabled-form states; saved pipeline state is explicit. | MIME/kind/ownership failures are surfaced; no-rendering, no-delivery, and external-handoff boundaries remain visible. |
| `/nifty` | Informational market module | Data, watch, and alert lists expose loading and empty states. | Delayed-data/error/disclosure states remain visible and no trading action is offered. |
| `/github`, `/github/details` | Authorized GitHub intelligence | Repository, issue, PR, commit, and review panels include loading and no-record states. | Credential, invalid-input, and upstream errors are rendered; procedures are read only. |
| `/deployments`, `/integrations`, `/settings` | Provider operations | Registry cards explicitly distinguish loading, connected, disconnected, and empty targets. | Provider-unavailable and required-credential states are explicit; no placeholder control performs a deploy. |
| `/logs` | Audit logs and workflow trace | Search results and execution trace use loading/empty states. | Query failure cards and owner-scoped trace boundaries are visible. |
| `/404` and unknown paths | Not Found | A deterministic missing-route surface is rendered. | Global `ErrorBoundary` provides an additional unexpected-render fallback. |

## Responsive verification

A final desktop sweep covered Dashboard, Agents, Workflows, Video Readiness, Schedules, Deployments, Logs, and Content Studio. A fixed 375px sweep covered Agents, Workflows, Video Readiness, Schedules, Deployments, Logs, Content Studio, and GitHub. The captures show readable empty, unavailable, pending, and populated states without horizontal clipping.

## Authorization boundary

The sole client entry gate is `DashboardLayout`, which presents **Sign in to command center** when the authenticated session is unavailable. All data-changing routes rely on protected server procedures; every persisted entity reviewed in the feature suite is owner scoped. The client never constructs privileged provider credentials, and connected provider cards describe unavailable mapping requirements instead of assuming authorization.

## Query module inventory

Each query-consuming client module is listed below with the explicit state signal retained in its source. Components inherit the authenticated shell and protected-procedure authorization boundary; any owner-scoped mutation additionally returns visible mutation feedback.

| Module | Loading / pending | Empty / error / authorization boundary |
| --- | --- | --- |
| `client/src/components/ApprovalResolutionControls.tsx` | Pending resolution controls | Empty approval queue, mutation errors, owner scope |
| `client/src/components/AssetLinkedExportPanel.tsx` | Project/export query pending state | Empty export list and asset ownership errors |
| `client/src/components/CitationEditorPanel.tsx` | Citation query loading | Empty citation state and mutation errors |
| `client/src/components/ContentArtifactPanel.tsx` | Project/artifact loading | Empty selector and protected artifact errors |
| `client/src/components/ContentRecordsPanel.tsx` | Citation/export loading | Empty records and visible create errors |
| `client/src/components/NiftyAlertManager.tsx` | Alert definition loading | Empty alert record and boundary disclosure |
| `client/src/components/NiftyWatchManager.tsx` | Watch definition loading | Empty watch record and non-advisory disclosure |
| `client/src/components/ScheduleDefinitionPanel.tsx` | Workflow query loading | Empty workflow selector and validation errors |
| `client/src/components/ScheduleExecutionHistoryPanel.tsx` | History loading skeleton | Empty callback history and retry state |
| `client/src/components/ScheduleLifecyclePanel.tsx` | Schedule query loading | Empty lifecycle list and mutation errors |
| `client/src/components/VideoAssetPlanPanel.tsx` | Project/media asset loading | Empty managed assets and slot validation errors |
| `client/src/components/VideoReadinessPanel.tsx` | Job query loading | Empty jobs, readiness error, no-rendering boundary |
| `client/src/components/VideoSavedOperationPanel.tsx` | Saved plan loading | Empty saved operation state and exact ON/OFF badges |
| `client/src/components/WorkflowDefinitionEditor.tsx` | Workflow loading | Empty workflow state and structural validation errors |
| `client/src/components/WorkflowTracePanel.tsx` | Run trace loading skeleton | Empty trace state and query retry card |
| `client/src/pages/ChatPage.tsx` | Conversation loading | Empty conversation and provider/mutation error feedback |
| `client/src/pages/DashboardPage.tsx` | Snapshot skeleton | Dashboard/integration error cards and retry controls |
| `client/src/pages/GitHubDetailsPage.tsx` | Repository detail loading | Empty details, invalid input, upstream error feedback |
| `client/src/pages/MaintenancePage.tsx` | Plan/cycle loading | Empty plan and cycle history with read-only boundary |
| `client/src/pages/MediaUploadPage.tsx` | Project/asset loading | Empty projects, MIME errors, owner association control |
| `client/src/pages/ModulePage.tsx` | Provider target loading | Empty target state and unavailable credential mapping |
| `client/src/pages/NiftyPage.tsx` | Market data loading | Delayed data error card and retry control |
| `client/src/pages/OperationsPages.tsx` | Agent/project/log loading | Empty cards, audit error feedback, protected ownership |
| `client/src/pages/ProjectActivityPage.tsx` | Project/activity loading | Empty selection and per-query error/retry cards |
| `client/src/pages/StudioPages.tsx` | Content/media/video loading | Empty asset/job lists and mutation error feedback |
| `client/src/pages/WorkflowPages.tsx` | Workflow/schedule loading | Empty workflow state, queue errors, approval guards |

## Full custom module inventory

The following inventory includes all custom page and component modules. A **parent-provided** entry is intentionally presentational: it inherits its loading, error, authentication, or empty-state boundary from the documented page or feature parent rather than issuing its own query.

| Module | Boundary |
| --- | --- |
| `client/src/components/AIChatBox.tsx` | Conversation-empty, send-pending, provider-error boundary |
| `client/src/components/ApprovalResolutionControls.tsx` | Loading, empty, pending resolution, owner-error boundary |
| `client/src/components/AssetLinkedExportPanel.tsx` | Asset/export loading, empty, ownership-error boundary |
| `client/src/components/CitationEditorPanel.tsx` | Citation loading, empty, mutation-error boundary |
| `client/src/components/ContentArtifactPanel.tsx` | Artifact loading, empty, protected mutation-error boundary |
| `client/src/components/ContentRecordsPanel.tsx` | Citation/export loading, empty, create-error boundary |
| `client/src/components/DashboardLayout.tsx` | Sign-in authorization gate and shell fallback |
| `client/src/components/DashboardLayoutSkeleton.tsx` | Parent-provided shell loading placeholder |
| `client/src/components/ErrorBoundary.tsx` | Unexpected-render error fallback |
| `client/src/components/ManusDialog.tsx` | Parent-provided dialog validation/error boundary |
| `client/src/components/Map.tsx` | Parent-provided map/provider availability boundary |
| `client/src/components/NiftyAlertManager.tsx` | Alert loading, empty, non-advisory boundary |
| `client/src/components/NiftyWatchManager.tsx` | Watch loading, empty, delayed-data boundary |
| `client/src/components/ScheduleDefinitionPanel.tsx` | Workflow loading, empty selector, validation boundary |
| `client/src/components/ScheduleExecutionHistoryPanel.tsx` | History loading, empty, retry boundary |
| `client/src/components/ScheduleLifecyclePanel.tsx` | Lifecycle loading, empty, mutation-error boundary |
| `client/src/components/VideoAssetPlanPanel.tsx` | Asset loading, empty, slot-validation boundary |
| `client/src/components/VideoPipelineOperationBadges.tsx` | Parent-provided saved-state display boundary |
| `client/src/components/VideoReadinessPanel.tsx` | Job loading, empty, no-rendering boundary |
| `client/src/components/VideoSavedOperationPanel.tsx` | Saved-state loading, empty, ON/OFF boundary |
| `client/src/components/WorkflowCanvas.tsx` | Parent-provided graph-empty and remove-control boundary |
| `client/src/components/WorkflowDefinitionEditor.tsx` | Workflow loading, empty, structural-error boundary |
| `client/src/components/WorkflowTracePanel.tsx` | Trace loading, empty, retry boundary |
| `client/src/pages/ChatPage.tsx` | Chat loading, empty, provider-error boundary |
| `client/src/pages/ComponentShowcase.tsx` | Static component reference route; shell authorization gate |
| `client/src/pages/DashboardPage.tsx` | Snapshot loading, empty, retry-error boundary |
| `client/src/pages/GitHubDetailsPage.tsx` | Detail loading, empty, upstream-error boundary |
| `client/src/pages/Home.tsx` | Shell authorization gate and dashboard entry boundary |
| `client/src/pages/MaintenancePage.tsx` | Plan/cycle loading, empty, read-only boundary |
| `client/src/pages/MediaUploadPage.tsx` | Project/asset loading, empty, MIME-error boundary |
| `client/src/pages/ModulePage.tsx` | Target loading, empty, credential-unavailable boundary |
| `client/src/pages/NiftyPage.tsx` | Market loading, delayed-data error/retry boundary |
| `client/src/pages/NotFound.tsx` | Deterministic unknown-route boundary |
| `client/src/pages/OperationsPages.tsx` | Agent/project/log loading, empty, owner-error boundary |
| `client/src/pages/ProjectActivityPage.tsx` | Project/activity loading, empty, retry-error boundary |
| `client/src/pages/StudioPages.tsx` | Studio loading, empty, asset/job-error boundary |
| `client/src/pages/WorkflowPages.tsx` | Workflow/schedule loading, empty, approval-error boundary |

## Responsive verification ledger

Every custom module below is linked to a captured parent surface at **1280px desktop** and **375px mobile**. A parent-provided module intentionally inherits its page’s direct state boundary; this ledger records that dependency explicitly.

| Module | Verified parent surface | Responsive evidence |
| --- | --- | --- |
| `client/src/components/AIChatBox.tsx` | `/chat` | Desktop + 375px |
| `client/src/components/ApprovalResolutionControls.tsx` | `/agents`, `/workflows` | Desktop + 375px |
| `client/src/components/AssetLinkedExportPanel.tsx` | `/content` | Desktop + 375px |
| `client/src/components/CitationEditorPanel.tsx` | `/content` | Desktop + 375px |
| `client/src/components/ContentArtifactPanel.tsx` | `/content` | Desktop + 375px |
| `client/src/components/ContentRecordsPanel.tsx` | `/content` | Desktop + 375px |
| `client/src/components/DashboardLayout.tsx` | All captured routes | Desktop + 375px |
| `client/src/components/DashboardLayoutSkeleton.tsx` | `/` | Desktop + 375px, parent-provided |
| `client/src/components/ErrorBoundary.tsx` | All captured routes | Desktop + 375px, fallback retained |
| `client/src/components/ManusDialog.tsx` | `/boundary-dialog` | Desktop + 375px, direct fixed-overlay capture |
| `client/src/components/Map.tsx` | `/boundary-verification` | Desktop + 375px, direct unavailable-state capture |
| `client/src/components/NiftyAlertManager.tsx` | `/nifty` | Desktop + 375px |
| `client/src/components/NiftyWatchManager.tsx` | `/nifty` | Desktop + 375px |
| `client/src/components/ScheduleDefinitionPanel.tsx` | `/schedules` | Desktop + 375px |
| `client/src/components/ScheduleExecutionHistoryPanel.tsx` | `/schedules` | Desktop + 375px |
| `client/src/components/ScheduleLifecyclePanel.tsx` | `/schedules` | Desktop + 375px |
| `client/src/components/VideoAssetPlanPanel.tsx` | `/video` | Desktop + 375px |
| `client/src/components/VideoPipelineOperationBadges.tsx` | `/video` | Desktop + 375px, parent-provided |
| `client/src/components/VideoReadinessPanel.tsx` | `/video` | Desktop + 375px |
| `client/src/components/VideoSavedOperationPanel.tsx` | `/video` | Desktop + 375px |
| `client/src/components/WorkflowCanvas.tsx` | `/workflows` | Desktop + 375px, parent-provided |
| `client/src/components/WorkflowDefinitionEditor.tsx` | `/workflows` | Desktop + 375px |
| `client/src/components/WorkflowTracePanel.tsx` | `/logs` | Desktop + 375px |
| `client/src/pages/ChatPage.tsx` | `/chat` | Desktop + 375px |
| `client/src/pages/ComponentShowcase.tsx` | `/` shell | Desktop + 375px, shell inherited |
| `client/src/pages/DashboardPage.tsx` | `/` | Desktop + 375px |
| `client/src/pages/GitHubDetailsPage.tsx` | `/github` | Desktop + 375px |
| `client/src/pages/Home.tsx` | `/` | Desktop + 375px |
| `client/src/pages/MaintenancePage.tsx` | `/maintenance` | Desktop + 375px |
| `client/src/pages/MediaUploadPage.tsx` | `/media` | Desktop + 375px |
| `client/src/pages/ModulePage.tsx` | `/deployments`, `/integrations` | Desktop + 375px |
| `client/src/pages/NiftyPage.tsx` | `/nifty` | Desktop + 375px |
| `client/src/pages/NotFound.tsx` | Unknown route boundary | Desktop + 375px, shell fallback |
| `client/src/pages/OperationsPages.tsx` | `/agents`, `/projects`, `/logs` | Desktop + 375px |
| `client/src/pages/ProjectActivityPage.tsx` | `/projects` | Desktop + 375px |
| `client/src/pages/StudioPages.tsx` | `/content`, `/images`, `/media`, `/research`, `/video` | Desktop + 375px |
| `client/src/pages/WorkflowPages.tsx` | `/workflows`, `/schedules` | Desktop + 375px |
