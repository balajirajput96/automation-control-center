#!/usr/bin/env bash
set +e
OUT="/home/ubuntu/github-workspace/checkpoints/current_project_integrations.tsv"
mkdir -p "$(dirname "$OUT")"
printf 'area\tstatus\tdetail\n' > "$OUT"
record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$OUT"; }
export PATH=/home/ubuntu/.nvm/versions/node/v22.13.0/bin:/home/ubuntu/.local/bin:$PATH
if gh auth status >/tmp/b_gh_auth 2>&1; then record github-auth pass 'gh auth status succeeded'; else record github-auth fail "$(tr '\n' ' ' < /tmp/b_gh_auth)"; fi
repo_json="$(gh repo view balajirajput96/B --json nameWithOwner,defaultBranchRef,url 2>/tmp/b_repo_err)"
if [ -n "$repo_json" ]; then record github-repo pass "$(printf '%s' "$repo_json" | tr '\n' ' ')"; else record github-repo fail "$(tr '\n' ' ' < /tmp/b_repo_err)"; fi
runs="$(gh run list --repo balajirajput96/B --limit 10 --json databaseId,name,status,conclusion,headBranch,createdAt --jq '.[] | [.databaseId,.name,.status,(.conclusion // ""),.headBranch,.createdAt] | @tsv' 2>/tmp/b_runs_err)"
if [ -n "$runs" ]; then printf '%s\n' "$runs" > /home/ubuntu/github-workspace/checkpoints/current_project_workflow_runs.tsv; latest_bad="$(printf '%s\n' "$runs" | awk -F '\t' '$3=="completed" && $4!="success" {print; bad=1} END{if(bad) exit 0; exit 1}')"; if [ -n "$latest_bad" ]; then record github-actions warn "recent non-success run(s): $(printf '%s' "$latest_bad" | tr '\n' ' ')"; else record github-actions pass 'latest 10 runs completed successfully'; fi; else record github-actions warn "$(tr '\n' ' ' < /tmp/b_runs_err)"; fi
prs="$(gh pr list --repo balajirajput96/B --state open --limit 20 --json number,title,headRefName,baseRefName,statusCheckRollup --jq '.[] | [.number,.title,.headRefName,.baseRefName] | @tsv' 2>/tmp/b_pr_err)"
if [ -n "$prs" ]; then
  printf '%s\n' "$prs" > /home/ubuntu/github-workspace/checkpoints/current_project_open_prs.tsv
  record open-prs pass "$(printf '%s' "$prs" | tr '\n' ' ')"
elif [ -s /tmp/b_pr_err ]; then
  record open-prs warn "$(tr '\n' ' ' < /tmp/b_pr_err)"
else
  record open-prs pass 'no open pull requests'
fi
if command -v jules >/dev/null 2>&1; then
  jules_output="$(jules remote list --repo balajirajput96/B 2>&1)"
  jrc=$?
  if printf '%s' "$jules_output" | grep -qiE '(without a valid client|did you forget to login|not logged in|oauth)'; then
    record jules deferred 'OAuth session unavailable; interactive login required'
  elif [ "$jrc" -eq 0 ]; then
    record jules pass 'remote list succeeded'
  else
    record jules warn "remote probe failed; exit=$jrc"
  fi
else
  record jules skipped 'CLI unavailable'
fi
if command -v agy >/dev/null 2>&1; then record antigravity deferred 'CLI present; account login intentionally deferred by user'; else record antigravity deferred 'CLI unavailable after reset; account login intentionally deferred by user'; fi
if command -v gemini >/dev/null 2>&1; then record gemini deferred 'Gemini command present; account mode not reauthorized'; else record gemini deferred 'Gemini CLI not present; account mode not reauthorized'; fi
if command -v datadog >/dev/null 2>&1 || command -v ddog >/dev/null 2>&1; then record datadog available 'CLI present'; else record datadog unavailable 'no Datadog CLI or configured connector detected'; fi
