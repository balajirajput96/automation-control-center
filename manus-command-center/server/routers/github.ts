import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const repoName = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Use owner/repository format");
export const githubReviewInput = z.object({
  repository: repoName,
  pullNumber: z.number().int().positive(),
});

export async function githubGet(path: string) {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (!token)
    throw new Error(
      "GitHub application credential is not configured (set GITHUB_TOKEN or GH_TOKEN)"
    );
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "ai-automation-command-center",
    },
  });
  if (!response.ok)
    throw new Error(`GitHub request failed (${response.status})`);
  return response.json() as Promise<unknown>;
}

export function mapGithubReviewRow(
  row: Record<string, unknown>,
  repository: string,
  pullNumber: number
) {
  return {
    id: Number(row.id),
    state: String(row.state || "PENDING"),
    reviewer: String(
      (row.user as Record<string, unknown> | undefined)?.login ||
        "Unknown reviewer"
    ),
    submittedAt: String(row.submitted_at || ""),
    body: typeof row.body === "string" ? row.body : "",
    url: String(
      row.html_url || `https://github.com/${repository}/pull/${pullNumber}`
    ),
  };
}

export const githubRouter = router({
  repos: protectedProcedure.query(async () => {
    const rows = (await githubGet(
      "/user/repos?per_page=100&sort=updated"
    )) as Array<Record<string, unknown>>;
    return rows.slice(0, 48).map(row => ({
      fullName: String(row.full_name),
      private: Boolean(row.private),
      defaultBranch: String(row.default_branch || "main"),
      updatedAt: String(row.updated_at || ""),
      description: typeof row.description === "string" ? row.description : null,
      url: String(row.html_url),
    }));
  }),
  issues: protectedProcedure
    .input(z.object({ repository: repoName }))
    .query(async ({ input }) => {
      const rows = (await githubGet(
        `/repos/${input.repository}/issues?state=open&per_page=50`
      )) as Array<Record<string, unknown>>;
      return rows
        .filter(row => !row.pull_request)
        .map(row => ({
          number: Number(row.number),
          title: String(row.title),
          state: String(row.state),
          url: String(row.html_url),
          updatedAt: String(row.updated_at || ""),
        }));
    }),
  pulls: protectedProcedure
    .input(z.object({ repository: repoName }))
    .query(async ({ input }) => {
      const rows = (await githubGet(
        `/repos/${input.repository}/pulls?state=open&per_page=50`
      )) as Array<Record<string, unknown>>;
      return rows.map(row => ({
        number: Number(row.number),
        title: String(row.title),
        state: String(row.state),
        draft: Boolean(row.draft),
        url: String(row.html_url),
        updatedAt: String(row.updated_at || ""),
      }));
    }),
  reviews: protectedProcedure
    .input(githubReviewInput)
    .query(async ({ input }) => {
      const rows = (await githubGet(
        `/repos/${input.repository}/pulls/${input.pullNumber}/reviews?per_page=100`
      )) as Array<Record<string, unknown>>;
      return rows.map(row =>
        mapGithubReviewRow(row, input.repository, input.pullNumber)
      );
    }),
  commits: protectedProcedure
    .input(z.object({ repository: repoName }))
    .query(async ({ input }) => {
      const rows = (await githubGet(
        `/repos/${input.repository}/commits?per_page=30`
      )) as Array<Record<string, unknown>>;
      return rows.map(row => ({
        sha: String(row.sha).slice(0, 7),
        message: String(
          (row.commit as Record<string, unknown> | undefined)?.message || ""
        ).split("\n")[0],
        url: String(row.html_url),
        author: String(
          ((row.commit as Record<string, unknown> | undefined)?.author &&
            (
              (row.commit as Record<string, unknown>).author as Record<
                string,
                unknown
              >
            ).name) ||
            "Unknown"
        ),
      }));
    }),
});
