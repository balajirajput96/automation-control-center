import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const recurrenceTypes = ["once", "hourly", "daily", "weekly", "monthly", "cron", "event"] as const;

export function ScheduleLifecyclePanel() {
  const schedules = trpc.schedules.list.useQuery();
  const workflows = trpc.workflows.list.useQuery();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<(typeof recurrenceTypes)[number]>("daily");
  const [timezone, setTimezone] = useState("UTC");
  const [cronExpression, setCronExpression] = useState("");
  const refresh = async () => { await schedules.refetch(); };
  const remove = trpc.schedules.remove.useMutation({ onSuccess: async () => { await refresh(); toast.success("Paused schedule definition deleted."); }, onError: error => toast.error(error.message) });
  const update = trpc.schedules.update.useMutation({ onSuccess: async () => { await refresh(); setEditingId(null); toast.success("Schedule definition updated and kept paused."); }, onError: error => toast.error(error.message) });
  const startEdit = (schedule: NonNullable<typeof schedules.data>[number]) => { setEditingId(schedule.id); setName(schedule.name); setWorkflowId(String(schedule.workflowId)); setRecurrenceType(schedule.recurrenceType as (typeof recurrenceTypes)[number]); setTimezone(schedule.timezone); setCronExpression(schedule.cronExpression ?? ""); };
  const busy = remove.isPending || update.isPending;
  return <Card className="blueprint-card border-0"><CardContent className="p-5"><p className="eyebrow">SCHEDULE LIFECYCLE</p><p className="mt-2 text-sm text-slate-600">Edit or delete owner-scoped paused definitions. These management actions never invoke a callback or workflow run.</p><div className="mt-4 space-y-3">{schedules.isLoading ? <div className="h-12 animate-pulse rounded-xl bg-slate-100" /> : schedules.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Schedule definitions could not be loaded. Please retry.</div> : schedules.data?.length ? schedules.data.map(schedule => <div key={schedule.id} className="rounded-xl border border-slate-100 bg-white/70 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">{schedule.name}</p><p className="mt-1 text-xs text-slate-500">{schedule.recurrenceType} · {schedule.status} · {schedule.timezone}</p></div><div className="flex gap-1"><Button variant="ghost" size="sm" disabled={busy} onClick={() => startEdit(schedule)}><Pencil className="mr-1.5 size-3.5" />Edit</Button><Button variant="outline" size="sm" disabled={busy} className="border-rose-200 text-rose-700" onClick={() => remove.mutate({ id: schedule.id })}><Trash2 className="mr-1.5 size-3.5" />Delete</Button></div></div>{editingId === schedule.id && <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-2"><div className="space-y-1"><Label>Schedule name</Label><Input value={name} onChange={event => setName(event.target.value)} /></div><div className="space-y-1"><Label>Workflow</Label><Select value={workflowId} onValueChange={setWorkflowId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{workflows.data?.map(workflow => <SelectItem key={workflow.id} value={String(workflow.id)}>{workflow.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Recurrence</Label><Select value={recurrenceType} onValueChange={value => setRecurrenceType(value as typeof recurrenceType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{recurrenceTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Timezone</Label><Input value={timezone} onChange={event => setTimezone(event.target.value)} /></div>{recurrenceType === "cron" && <div className="space-y-1 md:col-span-2"><Label>Six-field UTC cron expression</Label><Input value={cronExpression} onChange={event => setCronExpression(event.target.value)} /><p className="text-xs text-slate-500">Cron schedules require six whitespace-separated fields.</p></div>}<div className="flex justify-end gap-2 md:col-span-2"><Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancel</Button><Button size="sm" disabled={busy || name.trim().length < 2 || !workflowId || (recurrenceType === "cron" && cronExpression.trim().split(/\s+/).length !== 6)} onClick={() => update.mutate({ id: schedule.id, name, workflowId: Number(workflowId), recurrenceType, timezone, cronExpression: recurrenceType === "cron" ? cronExpression : undefined })}>Save paused definition</Button></div></div>}</div>) : <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">No owner-scoped schedule definitions to manage.</div>}</div></CardContent></Card>;
}
