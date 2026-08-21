#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/workspace_common.sh"
PROJECT_ROOT="${PROJECT_ROOT:-$(workspace_project_root)}"
RECOVERY_ROOT="${RECOVERY_ROOT:-$PROJECT_ROOT/reports/private/recovery-workspace}"
META="${RECOVERY_METADATA:-$RECOVERY_ROOT/rebase_audit_latest.tsv}"
MODE="${1:---plan}"
RUN_UTC="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$RECOVERY_ROOT/recovery_plan_${RUN_UTC}.tsv"

if [[ "$MODE" != "--plan" && "$MODE" != "--apply" ]]; then
  printf 'usage: %s [--plan|--apply]\n' "$0" >&2
  exit 2
fi
if [[ "$MODE" == "--apply" && "${ALLOW_REPOSITORY_RECOVERY:-}" != "1" ]]; then
  printf 'refusing recovery apply without ALLOW_REPOSITORY_RECOVERY=1\n' >&2
  exit 2
fi

mkdir -p "$RECOVERY_ROOT"
printf 'repo\tdefault_branch\tplanned_action\tresult\tnote\n' > "$OUT"

if [ ! -s "$META" ]; then
  printf 'metadata_missing\t\tinspect\tblocker\tmissing_metadata=%s\n' "$META" >> "$OUT"
  printf '%s\n' "$OUT"
  exit 2
fi

while IFS=$'\t' read -r repo default_branch current_branch working_tree behind ahead remote_head action note; do
  [ "$repo" = "repo" ] && continue
  [ -n "$repo" ] || continue
  name="${repo#*/}"
  dest="$RECOVERY_ROOT/repos/$name"

  if [ -e "$dest" ] && [ ! -d "$dest/.git" ]; then
    printf '%s\t%s\tmanual_review\tblocker\tnon_git_path_exists=%s\n' "$repo" "$default_branch" "$dest" >> "$OUT"
    continue
  fi
  if [ -d "$dest/.git" ]; then
    if [ -n "$(git -C "$dest" status --porcelain)" ]; then
      printf '%s\t%s\tmanual_review\tblocker\tworking_tree_dirty\n' "$repo" "$default_branch" >> "$OUT"
      continue
    fi
    if [[ "$MODE" == "--apply" ]]; then
      if git -C "$dest" fetch --prune origin >/dev/null 2>&1 && git -C "$dest" switch "$default_branch" >/dev/null 2>&1 && git -C "$dest" merge --ff-only "origin/$default_branch" >/dev/null 2>&1; then
        printf '%s\t%s\tfast_forward\tpass\tclean\n' "$repo" "$default_branch" >> "$OUT"
      else
        printf '%s\t%s\tfast_forward\tblocker\tfetch_or_fast_forward_failed\n' "$repo" "$default_branch" >> "$OUT"
      fi
    else
      printf '%s\t%s\tfast_forward\tplanned\tset_allow_repository_recovery_to_apply\n' "$repo" "$default_branch" >> "$OUT"
    fi
  elif [[ "$MODE" == "--apply" ]]; then
    if gh repo clone "$repo" "$dest" >/dev/null 2>&1; then
      printf '%s\t%s\tclone\tpass\tcreated_clean_checkout\n' "$repo" "$default_branch" >> "$OUT"
    else
      printf '%s\t%s\tclone\tblocker\tclone_failed\n' "$repo" "$default_branch" >> "$OUT"
    fi
  else
    printf '%s\t%s\tclone\tplanned\tset_allow_repository_recovery_to_apply\n' "$repo" "$default_branch" >> "$OUT"
  fi
done < "$META"

printf '%s\n' "$OUT"
