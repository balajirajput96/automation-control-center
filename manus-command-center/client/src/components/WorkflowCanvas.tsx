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
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-[radial-gradient(circle_at_1px_1px,rgba(8,145,178,.12)_1px,transparent_0)] bg-[size:18px_18px] p-5">
    <div className="min-w-[720px]"><div className="mb-4 flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Editable graph draft · {edges.length} connections</p><p className="text-xs text-slate-500">Click a non-trigger node to remove it.</p></div><div className="grid grid-flow-col auto-cols-[150px] items-center gap-5">{nodes.map((node, index) => <div key={node.id} className="flex items-center gap-5"><div className={`group relative min-h-[82px] w-[150px] rounded-xl border p-3 shadow-sm ${tone(node.type)}`}><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">{node.type}</p><p className="mt-1 text-xs font-semibold text-slate-800">{node.label}</p>{node.type !== "trigger" && <Button aria-label={`Remove ${node.label}`} variant="ghost" size="icon" className="absolute -right-2 -top-2 size-6 rounded-full border bg-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100" onClick={() => onRemove(node.id)}><X className="size-3" /></Button>}</div>{index < nodes.length - 1 && <div className="relative h-px w-5 bg-slate-300 after:absolute after:-right-0.5 after:-top-1 after:border-b-4 after:border-l-4 after:border-t-4 after:border-b-transparent after:border-l-slate-300 after:border-t-transparent" />}</div>)}</div></div>
  </div>;
}
