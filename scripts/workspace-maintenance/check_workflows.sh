#!/usr/bin/env bash
set -u

INVENTORY="${1:-/home/ubuntu/github-workspace/checkpoints/repos.tsv}"
OUT="${2:-/home/ubuntu/github-workspace/checkpoints/workflow_status.tsv}"
printf 'repo\tworkflow\tstatus\tconclusion\tcreated_at\turl\n' > "$OUT"
overall_rc=0
while IFS=$'\t' read -r repo private fork branch updated pushed description; do
  [ -n "$repo" ] || continue
  [ "$fork" = "false" ] || continue
  err_file=$(mktemp)
  runs=$(gh run list --repo "$repo" --limit 5 --json workflowName,status,conclusion,createdAt,url --jq '.[] | [.workflowName, .status, (.conclusion // ""), .createdAt, .url] | @tsv' 2>"$err_file")
  rc=$?
  if [ "$rc" -ne 0 ]; then
    err=$(tr '\n' ' ' < "$err_file")
    printf '%s\t(api error)\tapi_error\t%s\t\t\n' "$repo" "$err" >> "$OUT"
    overall_rc=1
  elif [ -n "$runs" ]; then
    while IFS=$'\t' read -r workflow status conclusion created url; do
      printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$repo" "$workflow" "$status" "$conclusion" "$created" "$url" >> "$OUT"
    done <<< "$runs"
  else
    printf '%s\t(no recent workflow runs)\tno_runs\t\t\t\n' "$repo" >> "$OUT"
  fi
  rm -f "$err_file"
done < "$INVENTORY"
printf 'workflow_status=%s\n' "$OUT"
printf 'workflow_status_rc=%s\n' "$overall_rc"
exit "$overall_rc"
