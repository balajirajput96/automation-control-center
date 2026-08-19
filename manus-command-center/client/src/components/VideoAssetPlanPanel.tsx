import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Film } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const operations = ["clipping", "silenceRemoval", "captions", "voiceOver", "subtitles", "aspectRatioConversion"] as const;
type Operation = typeof operations[number];
const label: Record<Operation, string> = { clipping: "Clipping", silenceRemoval: "Silence removal", captions: "Captions", voiceOver: "Voice-over", subtitles: "Subtitles", aspectRatioConversion: "9:16 conversion" };

export function VideoAssetPlanPanel() {
  const projects = trpc.content.list.useQuery(); const assets = trpc.media.list.useQuery();
  const [projectId, setProjectId] = useState(""); const [title, setTitle] = useState(""); const [sourceAssetId, setSourceAssetId] = useState(""); const [thumbnailAssetId, setThumbnailAssetId] = useState(""); const [outputAssetId, setOutputAssetId] = useState("");
  const [selected, setSelected] = useState<Record<Operation, boolean>>({ clipping: true, silenceRemoval: true, captions: true, voiceOver: true, subtitles: true, aspectRatioConversion: true });
  const options = useMemo(() => assets.data?.filter(asset => String(asset.contentProjectId ?? "") === projectId) ?? [], [assets.data, projectId]);
  useEffect(() => { if (!projectId && projects.data?.[0]) setProjectId(String(projects.data[0].id)); }, [projectId, projects.data]);
  const create = trpc.video.create.useMutation({ onSuccess: () => toast.success("Configurable asset-linked video plan saved; rendering was not invoked."), onError: error => toast.error(error.message) });
  const assetSelect = (title: string, value: string, setValue: (value: string) => void) => <div className="space-y-1"><Label>{title}</Label><Select value={value} onValueChange={setValue}><SelectTrigger><SelectValue placeholder="Optional managed asset" /></SelectTrigger><SelectContent>{options.map(asset => <SelectItem key={asset.id} value={String(asset.id)}>{asset.name} · {asset.kind}</SelectItem>)}</SelectContent></Select></div>;
  return <Card className="blueprint-card border-0"><CardContent className="space-y-4 p-5"><div><p className="eyebrow">VERTICAL-VIDEO / ASSET PROVENANCE</p><p className="mt-2 text-sm leading-6 text-slate-600">Select managed project assets and an edit checklist. This stores a plan only; no renderer, export, delivery, or publish action is invoked.</p></div><div className="grid gap-3 md:grid-cols-2"><div className="space-y-1"><Label>Content project</Label><Select value={projectId} onValueChange={setProjectId}><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger><SelectContent>{projects.data?.map(project => <SelectItem key={project.id} value={String(project.id)}>{project.title}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Plan title</Label><Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Asset-linked vertical short" /></div>{assetSelect("Source asset", sourceAssetId, setSourceAssetId)}{assetSelect("Thumbnail asset", thumbnailAssetId, setThumbnailAssetId)}{assetSelect("Existing output asset", outputAssetId, setOutputAssetId)}</div><div className="rounded-xl border border-slate-200 p-3"><p className="font-mono text-[10px] uppercase tracking-[.12em] text-slate-500">Pipeline plan · no execution</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{operations.map(operation => <label key={operation} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={selected[operation]} onChange={event => setSelected(current => ({ ...current, [operation]: event.target.checked }))} />{label[operation]}</label>)}</div></div><Button disabled={create.isPending || !projectId || title.trim().length < 2} onClick={() => create.mutate({ title, contentProjectId: Number(projectId), outputFormat: "vertical_9_16", targetDurationSeconds: 60, sourceAssetId: sourceAssetId ? Number(sourceAssetId) : undefined, thumbnailAssetId: thumbnailAssetId ? Number(thumbnailAssetId) : undefined, outputAssetId: outputAssetId ? Number(outputAssetId) : undefined, storageMetadata: { attachmentMode: "owner_scoped_managed_asset", notes: `${operations.filter(operation => selected[operation]).map(operation => label[operation]).join(", ")} planned` }, editPlan: { ...selected, execution: "external_render_required" } })}><Film className="mr-2 size-4" />Save non-rendering plan</Button></CardContent></Card>;
}
