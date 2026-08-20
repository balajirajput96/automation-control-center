#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/workspace_common.sh"
TARGET_REPOSITORY="${TARGET_REPOSITORY:-balajirajput96/automation-control-center}"
OUTPUT_DIR="$(workspace_output_dir)"
OUT="${1:-$OUTPUT_DIR/workflow_status.tsv}"
mkdir -p "$(dirname "$OUT")"
printf 'repo\tworkflow\tstatus\tconclusion\tcreated_at\turl\n' > "$OUT"

if runs="$(gh run list --repo "$TARGET_REPOSITORY" --limit 10 --json workflowName,status,conclusion,createdAt,url --jq '.[] | [.workflowName,.status,(.conclusion // ""),.createdAt,.url] | @tsv' 2>"$OUTPUT_DIR/workflow_status.err")"; then
  if [ -n "$runs" ]; then
    while IFS=$'\t' read -r workflow status conclusion created_at url; do
      printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$TARGET_REPOSITORY" "$workflow" "$status" "$conclusion" "$created_at" "$url" >> "$OUT"
    done <<< "$runs"
  fi
  rm -f "$OUTPUT_DIR/workflow_status.err"
  printf '%s\n' "$OUT"
  exit 0
fi

error="$(sanitize_metadata < "$OUTPUT_DIR/workflow_status.err")"
printf '%s\t(api error)\tapi_error\t%s\t\t\n' "$TARGET_REPOSITORY" "$error" >> "$OUT"
printf '%s\n' "$OUT"
exit 1
