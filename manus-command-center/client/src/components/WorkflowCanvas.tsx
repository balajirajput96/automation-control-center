import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type CanvasNode = { id: string; type: string; label: string };
type CanvasEdge = { id: string; source: string; target: string; condition?: string };

function tone(type: string) {
  if (type === "trigger") return "border-cyan-300 bg-cyan-50";
  if (type === "condition" || type === "parallel") return "border-violet-300 bg-violet-50";
  if (type === "loop") return "border-amber-300 bg-amber-50";
  if (type === "approval") return "border-rose-300 bg-rose-50";
  return "border-slate-200 bg-white";
}

export function WorkflowCanvas({ nodes, edges, onRemove }: { nodes: CanvasNode[]; edges: CanvasEdge[]; onRemove: (id: string) => void }) {
  const relation = (next?: CanvasNode) => next?.type === "parallel" ? "fan-out" : next?.type === "condition" ? "branch" : next?.type === "loop" ? "iterate" : "then";
  const relationTone = (next?: CanvasNode) => next?.type === "parallel" ? "bg-violet-300" : next?.type === "condition" ? "bg-violet-300" : next?.type === "loop" ? "bg-amber-300" : "bg-slate-300";
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-[radial-gradient(circle_at_1px_1px,rgba(8,145,178,.12)_1px,transparent_0)] bg-[size:18px_18px] p-5">
    <div className="min-w-[720px]">
      <div className="mb-4 flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Editable graph draft · {edges.length} connections</p><p className="text-xs text-slate-500">Remove a node to revalidate its branch path.</p></div>
      <div className="mb-4 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-[0.1em]"><span className="rounded bg-slate-100 px-2 py-1 text-slate-600">then · sequence</span><span className="rounded bg-violet-100 px-2 py-1 text-violet-700">fan-out · parallel</span><span className="rounded bg-violet-100 px-2 py-1 text-violet-700">branch · conditional</span><span className="rounded bg-amber-100 px-2 py-1 text-amber-800">iterate · loop</span></div>
      <div className="grid grid-flow-col auto-cols-[150px] items-center gap-5">{nodes.map((node, index) => { const next = nodes[index + 1]; return <div key={node.id} className="flex items-center gap-5"><div className={`group relative min-h-[82px] w-[150px] rounded-xl border p-3 shadow-sm ${tone(node.type)}`}><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">{node.type}</p><p className="mt-1 text-xs font-semibold text-slate-800">{node.label}</p>{node.type !== "trigger" && <Button aria-label={`Remove ${node.label}`} variant="ghost" size="icon" className="absolute -right-2 -top-2 size-6 rounded-full border bg-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100" onClick={() => onRemove(node.id)}><X className="size-3" /></Button>}</div>{next && <div className="flex w-9 flex-col items-center gap-1"><span className="font-mono text-[8px] uppercase text-slate-500">{relation(next)}</span><div className={`relative h-px w-7 ${relationTone(next)} after:absolute after:-right-0.5 after:-top-1 after:border-b-4 after:border-l-4 after:border-t-4 after:border-b-transparent after:border-l-current after:border-t-transparent`} /></div>}</div>; })}</div>
    </div>
  </div>;
}
