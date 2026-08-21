import React from "react";
import { readVideoPipelineOperations } from "../../../shared/videoPipeline";

export function VideoPipelineOperationBadges({ editPlan, compact = false }: { editPlan?: unknown; compact?: boolean }) {
  return <div className={`grid gap-1.5 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>{readVideoPipelineOperations(editPlan).map(operation => <span key={operation.key} className={`rounded-md border px-2 py-1 font-mono text-[10px] ${operation.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-400"}`}><span className="mr-1">{operation.enabled ? "ON" : "OFF"}</span>{operation.label}</span>)}</div>;
}
