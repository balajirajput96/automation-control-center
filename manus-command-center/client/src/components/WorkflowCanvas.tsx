import { Button } from "@/components/ui/button";
import { Link2, X } from "lucide-react";

type CanvasNode = { id: string; type: string; label: string };
type CanvasEdge = { id: string; source: string; target: string; condition?: string };

function tone(type: string) {
  if (type === "trigger") return "border-cyan-300 bg-cyan-50";
  if (type === "condition" || type === "parallel") return "border-violet-300 bg-violet-50";
  if (type === "loop") return "border-amber-300 bg-amber-50";
  if (type === "approval") return "border-rose-300 bg-rose-50";
  return "border-slate-200 bg-white";
}

export function WorkflowCanvas({ nodes, edges, onRemove, onRemoveEdge }: { nodes: CanvasNode[]; edges: CanvasEdge[]; onRemove: (id: string) => void; onRemoveEdge?: (id: string) => void }) {
  const relation = (source?: CanvasNode) => source?.type === "parallel" ? "fan-out" : source?.type === "condition" ? "branch" : source?.type === "loop" ? "iterate" : "then";
  const relationTone = (source?: CanvasNode) => source?.type === "parallel" ? "bg-violet-300" : source?.type === "condition" ? "bg-violet-300" : source?.type === "loop" ? "bg-amber-300" : "bg-slate-300";
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-[radial-gradient(circle_at_1px_1px,rgba(8,145,178,.12)_1px,transparent_0)] bg-[size:18px_18px] p-5">
    <div className="min-w-[720px]">
      <div className="mb-4 flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Editable graph draft · {nodes.length} nodes · {edges.length} connections</p><p className="text-xs text-slate-500">Remove a node to remove its connected edges.</p></div>
      <div className="mb-4 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-[0.1em]"><span className="rounded bg-slate-100 px-2 py-1 text-slate-600">then · sequence</span><span className="rounded bg-violet-100 px-2 py-1 text-violet-700">fan-out · parallel</span><span className="rounded bg-violet-100 px-2 py-1 text-violet-700">branch · conditional</span><span className="rounded bg-amber-100 px-2 py-1 text-amber-800">iterate · loop</span></div>
      <div className="grid grid-flow-col auto-cols-[150px] gap-5">{nodes.map(node => <div key={node.id} className={`group relative min-h-[82px] w-[150px] rounded-xl border p-3 shadow-sm ${tone(node.type)}`}><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">{node.type}</p><p className="mt-1 text-xs font-semibold text-slate-800">{node.label}</p>{node.type !== "trigger" && <Button aria-label={`Remove ${node.label}`} variant="ghost" size="icon" className="absolute -right-2 -top-2 size-6 rounded-full border bg-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100" onClick={() => onRemove(node.id)}><X className="size-3" /></Button>}</div>)}</div>
      <div className="mt-5 rounded-xl border border-slate-200 bg-white/80 p-3"><div className="mb-2 flex items-center gap-2"><Link2 className="size-3.5 text-cyan-700" /><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">Explicit connections</p></div>{edges.length ? <div className="space-y-2">{edges.map(edge => { const source = nodes.find(node => node.id === edge.source); const target = nodes.find(node => node.id === edge.target); const relationLabel = edge.condition?.trim() || relation(source); return <div key={edge.id} className="flex items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-2 text-xs"><span className="min-w-0 truncate font-medium text-slate-700">{source?.label ?? edge.source}</span><span className={`h-px w-8 shrink-0 ${relationTone(source)}`} /><span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] uppercase text-slate-600">{relationLabel}</span><span className="min-w-0 truncate font-medium text-slate-700">{target?.label ?? edge.target}</span>{onRemoveEdge && <Button aria-label={`Remove connection ${edge.id}`} variant="ghost" size="icon" className="ml-auto size-6 text-slate-500" onClick={() => onRemoveEdge(edge.id)}><X className="size-3" /></Button>}</div>; })}</div> : <p className="text-xs text-slate-500">Add a connection to make sequence, branch, fan-out, or loop behavior explicit.</p>}</div>
    </div>
  </div>;
}
