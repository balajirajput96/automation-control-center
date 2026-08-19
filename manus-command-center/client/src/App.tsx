import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import { ContentStudioPage, ImageStudioPage, MediaLibraryPage, ResearchPage, VideoStudioPage } from "./pages/StudioPages";
import ModulePage from "./pages/ModulePage";
import { AgentsPage, LogsPage, ProjectsPage } from "./pages/OperationsPages";
import { SchedulesPage, WorkflowsPage } from "./pages/WorkflowPages";
import NiftyPage from "./pages/NiftyPage";
import GitHubDetailsPage from "./pages/GitHubDetailsPage";
import ProjectActivityPage from "./pages/ProjectActivityPage";
import { WorkflowRunApprovalsPage } from "./components/ApprovalResolutionControls";
import { ScheduleLifecyclePanel } from "./components/ScheduleLifecyclePanel";

const modulePaths = ["github", "content", "video", "images", "research", "deployments", "integrations", "logs", "settings"] as const;

function Router() {
  return <DashboardLayout><Switch>
    <Route path="/" component={DashboardPage} />
    <Route path="/chat" component={ChatPage} />
    <Route path="/content" component={ContentStudioPage} />
    <Route path="/images" component={ImageStudioPage} />
    <Route path="/media" component={MediaLibraryPage} />
    <Route path="/research" component={ResearchPage} />
    <Route path="/video" component={VideoStudioPage} />
    <Route path="/agents" component={AgentsPage} />
    <Route path="/projects" component={ProjectsPage} />
    <Route path="/projects/activity" component={ProjectActivityPage} />
    <Route path="/logs" component={LogsPage} />
    <Route path="/workflows" component={WorkflowsPage} />
    <Route path="/workflow-approvals" component={WorkflowRunApprovalsPage} />
    <Route path="/run-approvals" component={WorkflowRunApprovalsPage} />
    <Route path="/schedules" component={SchedulesPage} />
    <Route path="/schedule-lifecycle">{() => <div className="mx-auto max-w-[1100px] space-y-6"><section className="blueprint-card p-7"><p className="eyebrow">SCHEDULE DEFINITION GOVERNANCE</p><h1 className="mt-2 text-4xl font-black tracking-[-0.055em] text-slate-950">Schedule lifecycle</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Review and remove paused owner-scoped schedule definitions. Deletion never invokes a callback or workflow run.</p></section><ScheduleLifecyclePanel /></div>}</Route>
    <Route path="/nifty" component={NiftyPage} />
    <Route path="/github/details" component={GitHubDetailsPage} />
    {modulePaths.map(module => <Route key={module} path={`/${module}`}>{() => <ModulePage module={module} />}</Route>)}
    <Route path={"/404"} component={NotFound} />
    <Route component={NotFound} />
  </Switch></DashboardLayout>;
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
