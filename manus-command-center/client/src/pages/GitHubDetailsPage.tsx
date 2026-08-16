import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function GitHubDetailsPage() {
  const repos = trpc.github.repos.useQuery(); const [repository, setRepository] = useState("");
  const issues = trpc.github.issues.useQuery({ repository }, { enabled: repository.includes("/") });
  const pulls = trpc.github.pulls.useQuery({ repository }, { enabled: repository.includes("/") });
  const commits = trpc.github.commits.useQuery({ repository }, { enabled: repository.includes("/") });
  return <div className="mx-auto max-w-[1250px] space-y-6"><section className="blueprint-card p-7"><p className="eyebrow">READ-ONLY SOURCE CONTROL</p><h1 className="mt-2 text-4xl font-black">Repository details</h1><p className="mt-3 text-sm text-slate-600">Inspect issues, pull requests, and recent commits using the validated GitHub credential. No repository mutation is performed.</p></section><Card className="blueprint-card border-0"><CardContent className="flex gap-3 p-5"><Input value={repository} onChange={e => setRepository(e.target.value)} placeholder="owner/repository" list="repo-options" /><datalist id="repo-options">{repos.data?.map(repo => <option key={repo.fullName} value={repo.fullName} />)}</datalist><Button onClick={() => setRepository(repository.trim())}>Inspect</Button></CardContent></Card>{repository.includes("/") && <section className="grid gap-4 lg:grid-cols-3">{[["Open issues", issues.data], ["Open pull requests", pulls.data], ["Recent commits", commits.data]].map(([title, rows]) => <Card key={String(title)} className="blueprint-card border-0"><CardContent className="p-5"><p className="font-semibold">{String(title)}</p><div className="mt-4 space-y-3">{Array.isArray(rows) && rows.length ? rows.slice(0, 12).map((row: any) => <a key={row.url} href={row.url} target="_blank" rel="noreferrer" className="block border-b border-slate-100 pb-3 text-sm"><span className="font-mono text-[10px] text-cyan-800">{row.number ? `#${row.number}` : row.sha}</span><p className="mt-1 line-clamp-2">{row.title || row.message}</p></a>) : <p className="text-sm text-slate-500">No records available.</p>}</div></CardContent></Card>)}</section>}</div>;
}
