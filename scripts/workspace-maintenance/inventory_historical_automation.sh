#!/usr/bin/env bash
set -u
ROOT=/home/ubuntu/github-workspace
OUT="${1:-$ROOT/checkpoints/historical_automation_inventory.tsv}"
mkdir -p "$(dirname "$OUT")"
{
  printf 'section\tpath\tclassification\tdetails\n'
  while IFS= read -r f; do
    rel=${f#"$ROOT/"}
    mode=$(stat -c '%A' "$f" 2>/dev/null || true)
    bytes=$(stat -c '%s' "$f" 2>/dev/null || true)
    lines=$(wc -l < "$f" 2>/dev/null || true)
    sha=$(sha256sum "$f" 2>/dev/null | awk '{print $1}')
    syntax=unknown
    if bash -n "$f" >/dev/null 2>&1; then syntax=pass; else syntax=fail; fi
    classification=working-candidate
    case "$f" in
      *historical_discovery.sh|*inventory_historical_automation.sh) classification=discovery-inventory ;;
      *daily_maintenance.sh|*/checkpoints/*.sh) classification=validated-maintenance ;;
    esac
    printf 'workspace_script\t%s\t%s\tmode=%s;bytes=%s;lines=%s;sha256=%s;bash_n=%s\n' "$rel" "$classification" "$mode" "$bytes" "$lines" "$sha" "$syntax"
  done < <(find "$ROOT" -type f -name '*.sh' -not -path '*/node_modules/*' -not -path '*/.git/*' | sort)

  while IFS= read -r f; do
    rel=${f#"$ROOT/repos/"}
    repo=${rel%%/*}
    base=${rel#*/}
    event=$(grep -nE '^on:|^[[:space:]]+(push|pull_request|workflow_dispatch|schedule|workflow_call):' "$f" 2>/dev/null | tr '\n' ' ' | sed 's/[[:space:]]*$//')
    jobs=$(grep -nE '^jobs:' "$f" 2>/dev/null | tr '\n' ' ' | sed 's/[[:space:]]*$//')
    uses=$(grep -oE 'uses:[[:space:]]*[^#]+' "$f" 2>/dev/null | tr '\n' ' ' | sed 's/[[:space:]]*$//')
    if grep -qE '^[[:space:]]*schedule:' "$f" 2>/dev/null; then classification=scheduled-workflow; else classification=ci-workflow; fi
    if grep -qE '(ACTIONS_RUNTIME_TOKEN|GITHUB_TOKEN|secrets\.|token:|password:|api[_-]?key:)' "$f" 2>/dev/null; then secret_refs=present; else secret_refs=none; fi
    printf 'github_workflow\t%s\t%s\tevents=%s;jobs=%s;uses=%s;secret_refs=%s\n' "$repo/$base" "$classification" "$event" "$jobs" "$uses" "$secret_refs"
  done < <(find "$ROOT/repos" -type f \( -path '*/.github/workflows/*.yml' -o -path '*/.github/workflows/*.yaml' \) -not -path '*/node_modules/*' | sort)

  while IFS= read -r repo; do
    name=$(basename "$repo")
    files=$(find "$repo" -maxdepth 4 -type f \( -iname '*automation*' -o -iname '*workflow*' -o -iname '*orchestr*' -o -iname '*n8n*' -o -iname '*cron*' -o -iname '*schedule*' -o -iname '*maintenance*' \) -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null | sed "s#^$repo/##" | sort | tr '\n' ',' | sed 's/,$//')
    [ -n "$files" ] && printf 'repo_automation\t%s\treusable-candidate\tfiles=%s\n' "$name" "$files"
  done < <(find "$ROOT/repos" -mindepth 1 -maxdepth 1 -type d | sort)

  for f in "$ROOT/checkpoints/daily_latest.tsv" "$ROOT/checkpoints/exact_tests_daily.tsv" "$ROOT/checkpoints/current_project_checks.tsv" "$ROOT/checkpoints/project_b_merged_validation_2026-08-20.tsv"; do
    if [ -f "$f" ]; then printf 'evidence\t%s\tvalidated-evidence\tmodified=%s;lines=%s\n' "${f#"$ROOT/"}" "$(stat -c '%y' "$f" 2>/dev/null || true)" "$(wc -l < "$f")"; fi
  done
} > "$OUT"
printf '%s\n' "$OUT"
exit 0
