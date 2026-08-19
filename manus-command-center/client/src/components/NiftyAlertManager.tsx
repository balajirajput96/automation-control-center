import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function NiftyAlertManager() {
  const alerts = trpc.market.alerts.useQuery();
  const [name, setName] = useState("Daily-close movement notice");
  const [threshold, setThreshold] = useState("1.0");
  const thresholdPercent = Number(threshold);
  const valid = Number.isFinite(thresholdPercent) && thresholdPercent >= 0.1 && thresholdPercent <= 20;
  const create = trpc.market.createAlert.useMutation({ onSuccess: async () => { await alerts.refetch(); toast.success("Informational alert definition saved. Delivery remains disabled."); }, onError: error => toast.error(error.message) });
  const remove = trpc.market.removeAlert.useMutation({ onSuccess: async () => { await alerts.refetch(); toast.success("Informational alert definition removed."); }, onError: error => toast.error(error.message) });
  return <Card className="blueprint-card border-0"><CardContent className="space-y-4 p-5"><div><p className="eyebrow">INFORMATIONAL ALERT DEFINITIONS</p><p className="mt-2 text-sm leading-6 text-slate-600">Define a daily-close percentage threshold with mandatory delayed-data disclosure. It is **not scheduled**, **not delivering**, and does not suggest a trade or execute an order.</p></div><div className="grid gap-2 md:grid-cols-[1fr_140px_auto]"><Input aria-label="Alert definition name" value={name} onChange={event => setName(event.target.value)} /><Input aria-label="Alert threshold percent" type="number" min="0.1" max="20" step="0.1" value={threshold} onChange={event => setThreshold(event.target.value)} /><Button disabled={!valid || name.trim().length < 2 || create.isPending} onClick={() => create.mutate({ name, thresholdPercent, timezone: "Asia/Kolkata" })}>Save definition</Button></div>{!valid ? <p className="text-xs text-rose-700">Threshold must be between 0.1% and 20.0%.</p> : null}<div className="space-y-2">{alerts.isLoading ? <div className="h-12 animate-pulse rounded-xl bg-slate-100" /> : alerts.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Alert definitions could not be loaded. Please retry.</div> : alerts.data?.length ? alerts.data.map(alert => <div key={alert.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3"><div><p className="text-sm font-medium">{alert.name}</p><p className="mt-1 text-xs text-amber-900">Daily close · {(alert.thresholdBasisPoints / 100).toFixed(2)}% absolute move · delayed data disclosed · {alert.deliveryState.replace("_", " ")}</p></div><Button variant="ghost" size="icon" aria-label={`Delete ${alert.name}`} disabled={remove.isPending} onClick={() => remove.mutate({ id: alert.id })}><Trash2 className="size-4 text-rose-600" /></Button></div>) : <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">No informational alert definitions yet. Saving one never activates delivery.</div>}</div></CardContent></Card>;
}
