import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, Bot, BookOpenText, Boxes, CalendarClock, CircuitBoard, CloudCog, FileChartColumnIncreasing, GitBranch, Image, LayoutDashboard, LogOut, PanelLeft, RadioTower, Settings2, Sparkles, Upload, Video, Waypoints } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Sparkles, label: "AI Chat", path: "/chat" },
  { icon: Bot, label: "Agents", path: "/agents" },
  { icon: Boxes, label: "Projects", path: "/projects" },
  { icon: GitBranch, label: "GitHub", path: "/github" },
  { icon: Waypoints, label: "Workflows", path: "/workflows" },
  { icon: BookOpenText, label: "Content Studio", path: "/content" },
  { icon: Video, label: "Video Studio", path: "/video" },
  { icon: Image, label: "Image Studio", path: "/images" },
  { icon: Upload, label: "Media Library", path: "/media" },
  { icon: FileChartColumnIncreasing, label: "Research", path: "/research" },
  { icon: CalendarClock, label: "Schedules", path: "/schedules" },
  { icon: Activity, label: "Maintenance", path: "/maintenance" },
  { icon: CloudCog, label: "Deployments", path: "/deployments" },
  { icon: RadioTower, label: "Integrations", path: "/integrations" },
  { icon: CircuitBoard, label: "Logs", path: "/logs" },
  { icon: Settings2, label: "Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "command-center-sidebar-width";
const DEFAULT_WIDTH = 264;
const MIN_WIDTH = 212;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || DEFAULT_WIDTH);
  const { loading, user } = useAuth();

  useEffect(() => { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)); }, [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return <div className="blueprint-grid flex min-h-screen items-center justify-center p-6">
      <div className="blueprint-card w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-900"><CircuitBoard className="size-6" /></div>
        <p className="eyebrow">SECURE CONTROL PLANE</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">Sign in to command the system.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Your workspaces, agent policies, execution records, and integrations are isolated to your account.</p>
        <Button onClick={() => startLogin()} className="mt-7 w-full bg-slate-950 text-white hover:bg-slate-800">Sign in to command center</Button>
      </div>
    </div>;
  }
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const activeMenuItem = menuItems.find(item => item.path === location) ?? menuItems[0];

  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!isResizing || isCollapsed) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - left;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    };
    const stop = () => setIsResizing(false);
    if (isResizing) { document.addEventListener("mousemove", move); document.addEventListener("mouseup", stop); document.body.style.cursor = "col-resize"; }
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", stop); document.body.style.cursor = ""; };
  }, [isCollapsed, isResizing, setSidebarWidth]);

  return <>
    <div className="relative" ref={sidebarRef}>
      <Sidebar collapsible="icon" className="border-r border-slate-200/80 bg-white/85 backdrop-blur-xl" disableTransition={isResizing}>
        <SidebarHeader className="h-[76px] justify-center px-3">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-cyan-50" aria-label="Toggle navigation"><PanelLeft className="size-4" /></button>
            {!isCollapsed && <div className="min-w-0"><p className="eyebrow text-[9px]">AI AUTOMATION</p><p className="truncate text-sm font-black tracking-[-0.03em] text-slate-950">Command Center</p></div>}
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 pb-5">
          <div className="mb-2 px-3 pt-2 text-[9px] font-bold tracking-[0.16em] text-slate-400 group-data-[collapsible=icon]:hidden">CONTROL SURFACES</div>
          <SidebarMenu className="gap-0.5">
            {menuItems.map(item => <SidebarMenuItem key={item.path}>
              <SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-9 rounded-lg text-[13px] data-[active=true]:bg-cyan-50 data-[active=true]:font-semibold data-[active=true]:text-cyan-950 hover:bg-slate-100">
                <item.icon className="size-4" /><span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>)}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-slate-100 p-3">
          <DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-2.5 rounded-xl p-1 text-left hover:bg-slate-50 group-data-[collapsible=icon]:justify-center"><Avatar className="size-8 border border-slate-200"><AvatarFallback className="bg-soft-pink text-xs font-bold text-slate-800">{user?.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-semibold">{user?.name || "Workspace user"}</p><p className="truncate text-[10px] text-slate-500">authenticated</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive"><LogOut className="mr-2 size-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      {!isCollapsed && <div className="absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize hover:bg-cyan-200/70" onMouseDown={() => setIsResizing(true)} />}
    </div>
    <SidebarInset className="blueprint-grid min-h-screen bg-[#fbfdff]">
      <header className="flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/70 px-5 backdrop-blur-xl lg:px-8">
        <div className="flex items-center gap-3">{isMobile && <SidebarTrigger className="rounded-xl border bg-white" />}<div><p className="eyebrow">{activeMenuItem.label === "Dashboard" ? "SYSTEM OVERVIEW" : "MODULE"}</p><h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">{activeMenuItem.label}</h2></div></div>
        <div className="hidden items-center gap-2 sm:flex"><Badge variant="outline" className="border-cyan-200 bg-cyan-50 font-mono text-[10px] text-cyan-900">SYSTEM ONLINE</Badge><span className="font-mono text-[10px] text-slate-400">UTC SYNC</span></div>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </SidebarInset>
  </>;
}
