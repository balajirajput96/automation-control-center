import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { RotateCcw, Workflow } from "lucide-react";

function traceTone(status: string) {
  if (status === "failed") return "border-rose-200 bg-rose-50 text-rose-800";
  if (status === "needs_approval" || status === "queued") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "succeeded") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function WorkflowTracePanel() {
  const runs = trpc.workflows.runs.useQuery();
  return <section className="mx-auto max-w-[1250px]"><Card className="blueprint-card border-0"><CardContent className="p-5"><div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-900"><Workflow className="size-4" /></span><div><p className="eyebrow">WORKFLOW EXECUTION TRACE</p><p className="mt-1 text-sm leading-6 text-slate-600">Review owner-scoped run states, retry counts, recorded errors, and trigger sources. A queued or approved record does not imply that an execution adapter ran.</p></div></div><div className="mt-4 space-y-2">{runs.isLoading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />) : runs.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Workflow execution traces could not be loaded. Please retry the page.</div> : runs.data?.length ? runs.data.map(run => <div key={run.id} className="rounded-xl border border-slate-100 bg-white/70 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">Run #{run.id} · workflow #{run.workflowId}</p><span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${traceTone(run.status)}`}>{run.status.replaceAll("_", " ")}</span></div><div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-3"><span>Trigger: {run.triggerSource}</span><span className="flex items-center gap-1"><RotateCcw className="size-3" />Retries: {run.retryCount}</span><span>{run.createdAt ? new Date(run.createdAt).toLocaleString() : "Timestamp unavailable"}</span></div>{run.errorMessage ? <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs leading-5 text-rose-800">{run.errorMessage}</p> : null}</div>) : <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">No workflow execution records have been created for this owner.</div>}</div></CardContent></Card></section>;
}
