import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NiftyWatchManager } from "@/components/NiftyWatchManager";
import { NiftyAlertManager } from "@/components/NiftyAlertManager";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function NiftyPage() {
  const nifty = trpc.market.nifty.useQuery();
  const [thresholdInput, setThresholdInput] = useState("1.0");
  const threshold = Number(thresholdInput);
  const validThreshold = Number.isFinite(threshold) && threshold >= 0.1 && threshold <= 20;
  const data = nifty.data;
  const watch = useMemo(() => {
    if (!validThreshold || data?.changePercent === null || data?.changePercent === undefined) return null;
    return Math.abs(data.changePercent) >= threshold;
  }, [data?.changePercent, threshold, validThreshold]);

  return <div className="mx-auto max-w-[1250px] space-y-6">
    <section className="blueprint-card p-7 sm:p-9"><p className="eyebrow">MARKET MONITOR / INDIA</p><h1 className="mt-2 text-4xl font-black tracking-[-0.055em]">NIFTY 50</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Informational market monitoring with a source-disclosed, potentially delayed data feed. This module does not provide trading recommendations, alerts, or order execution.</p></section>
    <NiftyWatchManager />
    <NiftyAlertManager />
    <Card className="blueprint-card border-0"><CardContent className="flex flex-wrap items-end gap-4 p-5"><div><p className="eyebrow">INFORMATIONAL WATCH</p><label className="mt-2 block text-xs text-slate-600">Daily move threshold (%)<input aria-invalid={!validThreshold} className="ml-3 w-20 rounded border px-2 py-1 aria-[invalid=true]:border-rose-400" type="number" min="0.1" max="20" step="0.1" value={thresholdInput} onChange={event => setThresholdInput(event.target.value)} /></label></div><div className="max-w-xl text-xs text-slate-500">{!validThreshold ? <span className="text-rose-700">Enter a value from 0.1% to 20%. This setting remains local to the current screen.</span> : <><span>{watch === null ? `A future scheduler could observe absolute daily moves at ${threshold}%.` : watch ? `Available delayed data is at or above the ${threshold}% observation threshold.` : `Available delayed data is below the ${threshold}% observation threshold.`}</span><span className="block mt-1">No alert is sent, no trade is suggested, and no scheduler is activated.</span></>}</div></CardContent></Card>
    {nifty.isLoading ? <div className="blueprint-card p-16 text-center text-sm text-slate-500">Loading NIFTY market data…</div> : data ? <><section className="grid gap-4 md:grid-cols-3"><Card className="blueprint-card border-0"><CardContent className="p-5"><p className="eyebrow">LAST AVAILABLE</p><p className="mt-3 text-3xl font-black">{data.latest?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) ?? "—"}</p><p className="mt-2 text-xs text-slate-500">{data.currency} · {data.name}</p></CardContent></Card><Card className="blueprint-card border-0"><CardContent className="p-5"><p className="eyebrow">SESSION CHANGE</p><p className={`mt-3 text-3xl font-black ${(data.changePercent ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{data.changePercent === null ? "—" : `${data.changePercent >= 0 ? "+" : ""}${data.changePercent.toFixed(2)}%`}</p><p className="mt-2 text-xs text-slate-500">Absolute change: {data.change?.toFixed(2) ?? "—"}</p></CardContent></Card><Card className="blueprint-card border-0"><CardContent className="p-5"><p className="eyebrow">DATA STATUS</p><Badge variant="outline" className="mt-4 font-mono text-[10px]">{data.dataStatus}</Badge><p className="mt-3 text-xs text-slate-500">{data.source}<br />Retrieved {new Date(data.retrievedAt).toLocaleString()}</p></CardContent></Card></section><Card className="blueprint-card border-0"><CardContent className="p-6"><p className="font-semibold">Three-month close history</p><div className="mt-5 h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.points}><defs><linearGradient id="niftyFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.28}/><stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="timestamp" tickFormatter={value => new Date(value).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} tick={{ fontSize: 11 }} /><YAxis dataKey="close" domain={["dataMin - 100", "dataMax + 100"]} tick={{ fontSize: 11 }} /><Tooltip labelFormatter={value => new Date(Number(value)).toLocaleDateString("en-IN")} formatter={(value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} /><Area type="monotone" dataKey="close" stroke="#0891b2" strokeWidth={2} fill="url(#niftyFill)" /></AreaChart></ResponsiveContainer></div></CardContent></Card></> : <div className="blueprint-card p-16 text-center text-sm text-rose-700">Market data is temporarily unavailable. Please retry later.</div>}
  </div>;
}
