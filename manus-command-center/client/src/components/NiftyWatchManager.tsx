import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function NiftyWatchManager() {
  const utils = trpc.useUtils();
  const watches = trpc.market.watches.useQuery();
  const [name, setName] = useState("Daily close observation");
  const [threshold, setThreshold] = useState("1.0");
  const thresholdPercent = Number(threshold);
  const valid = Number.isFinite(thresholdPercent) && thresholdPercent >= 0.1 && thresholdPercent <= 20;
  const create = trpc.market.createWatch.useMutation({ onSuccess: async () => { await watches.refetch(); await utils.commandCenter.dashboard.invalidate(); toast.success("Informational watch saved. No scheduled delivery is active."); }, onError: error => toast.error(error.message) });
  const remove = trpc.market.removeWatch.useMutation({ onSuccess: async () => { await watches.refetch(); toast.success("Informational watch removed."); }, onError: error => toast.error(error.message) });
  return <Card className="blueprint-card border-0"><CardContent className="space-y-4 p-5"><div><p className="eyebrow">PERSISTED INFORMATIONAL WATCHES</p><p className="mt-2 text-sm leading-6 text-slate-600">Save an owner-scoped daily-close percentage-move observation. Market data can be delayed; this feature sends no alert, does not execute orders, and does not enable a scheduler.</p></div><div className="grid gap-2 md:grid-cols-[1fr_140px_auto]"><Input aria-label="Watch name" value={name} onChange={event => setName(event.target.value)} /><Input aria-label="Daily move threshold percent" type="number" min="0.1" max="20" step="0.1" value={threshold} onChange={event => setThreshold(event.target.value)} /><Button disabled={!valid || name.trim().length < 2 || create.isPending} onClick={() => create.mutate({ name, thresholdPercent, timezone: "Asia/Kolkata" })}>Save watch</Button></div>{!valid ? <p className="text-xs text-rose-700">Threshold must be between 0.1% and 20.0%.</p> : null}<div className="space-y-2">{watches.isLoading ? <div className="h-12 animate-pulse rounded-xl bg-slate-100" /> : watches.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Watch definitions could not be loaded. Please retry.</div> : watches.data?.length ? watches.data.map(watch => <div key={watch.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white/70 p-3"><div><p className="text-sm font-medium">{watch.name}</p><p className="mt-1 text-xs text-slate-500">Daily close · {(watch.thresholdBasisPoints / 100).toFixed(2)}% absolute move · {watch.enabled ? "observation saved" : "disabled"}</p></div><Button variant="ghost" size="icon" aria-label={`Delete ${watch.name}`} disabled={remove.isPending} onClick={() => remove.mutate({ id: watch.id })}><Trash2 className="size-4 text-rose-600" /></Button></div>) : <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">No persisted NIFTY watch definitions yet.</div>}</div></CardContent></Card>;
}
