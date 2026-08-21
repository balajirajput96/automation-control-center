import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("resilient client boundaries", () => {
  it("keeps dashboard snapshot and integration retry states explicit", () => {
    const dashboard = source("client/src/pages/DashboardPage.tsx");
    expect(dashboard).toContain("Dashboard data could not be loaded");
    expect(dashboard).toContain("Retry dashboard");
    expect(dashboard).toContain("Integration health could not be loaded");
    expect(dashboard).toContain("No integration health records are available yet.");
  });

  it("keeps NIFTY and project activity query failures separate from their empty states", () => {
    const nifty = source("client/src/pages/NiftyPage.tsx");
    const activity = source("client/src/pages/ProjectActivityPage.tsx");
    expect(nifty).toContain("Market data could not be loaded");
    expect(nifty).toContain("Retry market data");
    expect(activity).toContain("Projects could not be loaded");
    expect(activity).toContain("Project activity could not be loaded");
    expect(activity).toContain("No owner-scoped projects are available yet.");
  });

  it("keeps standalone map integration loading and unavailable states explicit", () => {
    const map = source("client/src/components/Map.tsx");
    expect(map).toContain("Loading authorized map provider…");
    expect(map).toContain("Map is unavailable. Verify the authorized map provider configuration before retrying.");
  });

  it("keeps an explicit loading, empty, error, pending, or auth boundary in every query-consuming client module", () => {
    const queryModules = [
      "client/src/components/ApprovalResolutionControls.tsx", "client/src/components/AssetLinkedExportPanel.tsx", "client/src/components/CitationEditorPanel.tsx", "client/src/components/ContentArtifactPanel.tsx", "client/src/components/ContentRecordsPanel.tsx", "client/src/components/NiftyAlertManager.tsx", "client/src/components/NiftyWatchManager.tsx", "client/src/components/ScheduleDefinitionPanel.tsx", "client/src/components/ScheduleExecutionHistoryPanel.tsx", "client/src/components/ScheduleLifecyclePanel.tsx", "client/src/components/VideoAssetPlanPanel.tsx", "client/src/components/VideoReadinessPanel.tsx", "client/src/components/VideoSavedOperationPanel.tsx", "client/src/components/WorkflowDefinitionEditor.tsx", "client/src/components/WorkflowTracePanel.tsx", "client/src/pages/ChatPage.tsx", "client/src/pages/DashboardPage.tsx", "client/src/pages/GitHubDetailsPage.tsx", "client/src/pages/MaintenancePage.tsx", "client/src/pages/MediaUploadPage.tsx", "client/src/pages/ModulePage.tsx", "client/src/pages/NiftyPage.tsx", "client/src/pages/OperationsPages.tsx", "client/src/pages/ProjectActivityPage.tsx", "client/src/pages/StudioPages.tsx", "client/src/pages/WorkflowPages.tsx",
    ];
    const explicitBoundary = /isLoading|isError|isPending|empty|Empty|ErrorBoundary|useAuth|Sign in/;
    expect(queryModules).toHaveLength(26);
    const audit = source("resilience-audit.md");
    for (const modulePath of queryModules) {
      expect(source(modulePath)).toMatch(explicitBoundary);
      expect(audit).toContain(`\`${modulePath}\``);
    }
  });

  it("keeps the route-family resilience inventory current", () => {
    const audit = source("resilience-audit.md");
    for (const routeFamily of ["/chat", "/agents", "/projects", "/workflows", "/schedules", "/content", "/video", "/nifty", "/github", "/deployments", "/logs", "/404"]) expect(audit).toContain(routeFamily);
    expect(audit).toContain("DashboardLayout");
    expect(audit).toContain("owner scoped");
  });

  it("documents every custom page and component with either a direct or parent-provided boundary", () => {
    const customModules = [
      "client/src/components/AIChatBox.tsx", "client/src/components/ApprovalResolutionControls.tsx", "client/src/components/AssetLinkedExportPanel.tsx", "client/src/components/CitationEditorPanel.tsx", "client/src/components/ContentArtifactPanel.tsx", "client/src/components/ContentRecordsPanel.tsx", "client/src/components/DashboardLayout.tsx", "client/src/components/DashboardLayoutSkeleton.tsx", "client/src/components/ErrorBoundary.tsx", "client/src/components/ManusDialog.tsx", "client/src/components/Map.tsx", "client/src/components/NiftyAlertManager.tsx", "client/src/components/NiftyWatchManager.tsx", "client/src/components/ScheduleDefinitionPanel.tsx", "client/src/components/ScheduleExecutionHistoryPanel.tsx", "client/src/components/ScheduleLifecyclePanel.tsx", "client/src/components/VideoAssetPlanPanel.tsx", "client/src/components/VideoPipelineOperationBadges.tsx", "client/src/components/VideoReadinessPanel.tsx", "client/src/components/VideoSavedOperationPanel.tsx", "client/src/components/WorkflowCanvas.tsx", "client/src/components/WorkflowDefinitionEditor.tsx", "client/src/components/WorkflowTracePanel.tsx", "client/src/pages/ChatPage.tsx", "client/src/pages/ComponentShowcase.tsx", "client/src/pages/DashboardPage.tsx", "client/src/pages/GitHubDetailsPage.tsx", "client/src/pages/Home.tsx", "client/src/pages/MaintenancePage.tsx", "client/src/pages/MediaUploadPage.tsx", "client/src/pages/ModulePage.tsx", "client/src/pages/NiftyPage.tsx", "client/src/pages/NotFound.tsx", "client/src/pages/OperationsPages.tsx", "client/src/pages/ProjectActivityPage.tsx", "client/src/pages/StudioPages.tsx", "client/src/pages/WorkflowPages.tsx",
    ];
    const audit = source("resilience-audit.md");
    expect(customModules).toHaveLength(37);
    for (const modulePath of customModules) expect(audit).toContain(`\`${modulePath}\``);
  });

  it("links every documented custom module to an explicit desktop and 375px verification surface", () => {
    const customModules = [
      "client/src/components/AIChatBox.tsx", "client/src/components/ApprovalResolutionControls.tsx", "client/src/components/AssetLinkedExportPanel.tsx", "client/src/components/CitationEditorPanel.tsx", "client/src/components/ContentArtifactPanel.tsx", "client/src/components/ContentRecordsPanel.tsx", "client/src/components/DashboardLayout.tsx", "client/src/components/DashboardLayoutSkeleton.tsx", "client/src/components/ErrorBoundary.tsx", "client/src/components/ManusDialog.tsx", "client/src/components/Map.tsx", "client/src/components/NiftyAlertManager.tsx", "client/src/components/NiftyWatchManager.tsx", "client/src/components/ScheduleDefinitionPanel.tsx", "client/src/components/ScheduleExecutionHistoryPanel.tsx", "client/src/components/ScheduleLifecyclePanel.tsx", "client/src/components/VideoAssetPlanPanel.tsx", "client/src/components/VideoPipelineOperationBadges.tsx", "client/src/components/VideoReadinessPanel.tsx", "client/src/components/VideoSavedOperationPanel.tsx", "client/src/components/WorkflowCanvas.tsx", "client/src/components/WorkflowDefinitionEditor.tsx", "client/src/components/WorkflowTracePanel.tsx", "client/src/pages/ChatPage.tsx", "client/src/pages/ComponentShowcase.tsx", "client/src/pages/DashboardPage.tsx", "client/src/pages/GitHubDetailsPage.tsx", "client/src/pages/Home.tsx", "client/src/pages/MaintenancePage.tsx", "client/src/pages/MediaUploadPage.tsx", "client/src/pages/ModulePage.tsx", "client/src/pages/NiftyPage.tsx", "client/src/pages/NotFound.tsx", "client/src/pages/OperationsPages.tsx", "client/src/pages/ProjectActivityPage.tsx", "client/src/pages/StudioPages.tsx", "client/src/pages/WorkflowPages.tsx",
    ];
    const ledger = source("resilience-audit.md").split("## Responsive verification ledger")[1];
    expect(ledger).toBeTruthy();
    for (const modulePath of customModules) {
      const entry = ledger.split("\n").find(line => line.includes(`\`${modulePath}\``));
      expect(entry).toContain("Desktop + 375px");
    }
  });
});
