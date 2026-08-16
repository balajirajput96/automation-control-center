import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const repoName = z.string().trim().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Use owner/repository format");

async function githubGet(path: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GitHub application credential is not configured");
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "ai-automation-command-center" },
  });
  if (!response.ok) throw new Error(`GitHub request failed (${response.status})`);
  return response.json() as Promise<unknown>;
}

export const githubRouter = router({
  repos: protectedProcedure.query(async () => {
    const rows = await githubGet("/user/repos?per_page=100&sort=updated") as Array<Record<string, unknown>>;
    return rows.slice(0, 48).map(row => ({ fullName: String(row.full_name), private: Boolean(row.private), defaultBranch: String(row.default_branch || "main"), updatedAt: String(row.updated_at || ""), description: typeof row.description === "string" ? row.description : null, url: String(row.html_url) }));
  }),
  issues: protectedProcedure.input(z.object({ repository: repoName })).query(async ({ input }) => {
    const rows = await githubGet(`/repos/${input.repository}/issues?state=open&per_page=50`) as Array<Record<string, unknown>>;
    return rows.filter(row => !row.pull_request).map(row => ({ number: Number(row.number), title: String(row.title), state: String(row.state), url: String(row.html_url), updatedAt: String(row.updated_at || "") }));
  }),
  pulls: protectedProcedure.input(z.object({ repository: repoName })).query(async ({ input }) => {
    const rows = await githubGet(`/repos/${input.repository}/pulls?state=open&per_page=50`) as Array<Record<string, unknown>>;
    return rows.map(row => ({ number: Number(row.number), title: String(row.title), state: String(row.state), draft: Boolean(row.draft), url: String(row.html_url), updatedAt: String(row.updated_at || "") }));
  }),
  commits: protectedProcedure.input(z.object({ repository: repoName })).query(async ({ input }) => {
    const rows = await githubGet(`/repos/${input.repository}/commits?per_page=30`) as Array<Record<string, unknown>>;
    return rows.map(row => ({ sha: String(row.sha).slice(0, 7), message: String((row.commit as Record<string, unknown> | undefined)?.message || "").split("\n")[0], url: String(row.html_url), author: String((row.commit as Record<string, unknown> | undefined)?.author && ((row.commit as Record<string, unknown>).author as Record<string, unknown>).name || "Unknown") }));
  }),
});
