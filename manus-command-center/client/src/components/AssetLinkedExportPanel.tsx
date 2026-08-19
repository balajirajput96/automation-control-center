import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function AssetLinkedExportPanel() {
  const projects = trpc.content.list.useQuery(); const assets = trpc.media.list.useQuery(); const [projectId, setProjectId] = useState(""); const [assetId, setAssetId] = useState(""); const [format, setFormat] = useState("video/mp4");
  const projectAssets = useMemo(() => assets.data?.filter(asset => String(asset.contentProjectId ?? "") === projectId) ?? [], [assets.data, projectId]);
  useEffect(() => { if (!projectId && projects.data?.[0]) setProjectId(String(projects.data[0].id)); }, [projectId, projects.data]); useEffect(() => { if (projectAssets[0] && !projectAssets.some(asset => String(asset.id) === assetId)) setAssetId(String(projectAssets[0].id)); }, [assetId, projectAssets]);
  const record = trpc.content.addExport.useMutation({ onSuccess: () => toast.success("Asset-linked export history recorded; no publication was triggered."), onError: error => toast.error(error.message) });
  return <Card className="blueprint-card border-0"><CardContent className="space-y-4 p-5"><div><p className="eyebrow">ASSET-LINKED EXPORT HISTORY</p><p className="mt-2 text-sm leading-6 text-slate-600">Attach a managed media asset to its content project’s export record. This records provenance only and never delivers the asset.</p></div><div className="grid gap-3 md:grid-cols-3"><div className="space-y-1"><Label>Project</Label><Select value={projectId} onValueChange={setProjectId}><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger><SelectContent>{projects.data?.map(project => <SelectItem key={project.id} value={String(project.id)}>{project.title}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Managed asset</Label><Select value={assetId} onValueChange={setAssetId} disabled={!projectAssets.length}><SelectTrigger><SelectValue placeholder={projectAssets.length ? "Select asset" : "No project assets"} /></SelectTrigger><SelectContent>{projectAssets.map(asset => <SelectItem key={asset.id} value={String(asset.id)}>{asset.name} · {asset.kind}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Export format</Label><Input value={format} onChange={event => setFormat(event.target.value)} /></div></div><Button disabled={record.isPending || !projectId || !assetId || format.trim().length < 2} onClick={() => record.mutate({ contentProjectId: Number(projectId), assetId: Number(assetId), format, status: "ready", destination: "managed-asset-record" })}><Link2 className="mr-2 size-4" />Record linked export</Button></CardContent></Card>;
}
