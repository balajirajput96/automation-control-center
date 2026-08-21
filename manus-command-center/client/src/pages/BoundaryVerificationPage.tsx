import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { ManusDialog } from "@/components/ManusDialog";
import { MapView } from "@/components/Map";
import { VideoPipelineOperationBadges } from "@/components/VideoPipelineOperationBadges";
import { WorkflowCanvas } from "@/components/WorkflowCanvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

const nodes = [{ id: "trigger", type: "trigger", label: "Manual start" }, { id: "approval", type: "approval", label: "Review boundary" }];
const edges = [{ id: "review", source: "trigger", target: "approval", condition: "approval required" }];

export function BoundaryVerificationPage({ forceDialog = false }: { forceDialog?: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(() => forceDialog || new URLSearchParams(window.location.search).get("dialog") === "1");
  return <div className="mx-auto max-w-[1100px] space-y-6"><section className="blueprint-card p-7"><p className="eyebrow">INTERNAL / RESPONSIVE BOUNDARY PROOF</p><h1 className="mt-2 text-4xl font-black tracking-[-0.055em] text-slate-950">Component boundaries</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">This internal page renders parent-provided components with non-destructive sample data. It performs no external action and exists only to verify loading, unavailable, graph, badge, and dialog boundaries.</p><Button className="mt-4" variant="outline" onClick={() => setDialogOpen(true)}>Show auth dialog boundary</Button></section><div className="grid gap-6 lg:grid-cols-2"><Card className="blueprint-card border-0"><CardContent className="space-y-3 p-5"><p className="eyebrow">SHELL LOADING</p><DashboardLayoutSkeleton /></CardContent></Card><Card className="blueprint-card border-0"><CardContent className="space-y-3 p-5"><p className="eyebrow">SAVED PIPELINE STATE</p><VideoPipelineOperationBadges editPlan={{ clipping: true, silenceRemoval: false, captions: true, voiceOver: false, subtitles: true, aspectRatioConversion: true }} /></CardContent></Card></div><Card className="blueprint-card border-0"><CardContent className="space-y-3 p-5"><p className="eyebrow">GRAPH RESPONSIVE OVERFLOW</p><WorkflowCanvas nodes={nodes} edges={edges} onRemove={() => undefined} onRemoveEdge={() => undefined} /></CardContent></Card><Card className="blueprint-card border-0"><CardContent className="space-y-3 p-5"><p className="eyebrow">MAP PROVIDER BOUNDARY</p><MapView className="h-[280px]" /></CardContent></Card><ManusDialog open={dialogOpen} onOpenChange={setDialogOpen} onLogin={() => setDialogOpen(false)} onClose={() => setDialogOpen(false)} title="Authentication boundary" /></div>;
}
