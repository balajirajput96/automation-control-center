#!/usr/bin/env bash
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ROOT="${WORKSPACE_ROOT:-${ROOT:-$PROJECT_ROOT/.workspace}}"
REPOS="${WORKSPACE_REPOS:-${REPOS:-$ROOT/repos}}"
META="${WORKSPACE_META:-${META:-$SCRIPT_DIR/original_repo_metadata.tsv}}"
OUT="${1:-$ROOT/checkpoints/rebase_audit_latest.tsv}"
mkdir -p "$(dirname "$OUT")"
printf 'repo\tdefault_branch\tcurrent_branch\tworking_tree\tbehind\tahead\tremote_head\taction\tnote\n' > "$OUT"
while IFS=$'\t' read -r repo default_branch language; do
  [ "$repo" = "repo" ] && continue
  [ -n "$repo" ] || continue
  name="${repo#*/}"
  dir="$REPOS/$name"
  if [ ! -d "$dir/.git" ]; then
    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$repo" "$default_branch" "missing" "missing" "-" "-" "-" "none" "local_checkout_missing" >> "$OUT"
    continue
  fi
  git -C "$dir" fetch origin --prune >/dev/null 2>&1 || true
  current=$(git -C "$dir" branch --show-current)
  [ -n "$current" ] || current="detached"
  if [ "$current" != "$default_branch" ]; then
    wt="clean"; [ -n "$(git -C "$dir" status --porcelain 2>/dev/null)" ] && wt="dirty"
    action="review_branch"; note="non_default_branch_preserved"
    [ "$wt" = "dirty" ] && { action="review_branch_dirty"; note="non_default_branch_has_uncommitted_changes"; }
    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$repo" "$default_branch" "$current" "$wt" "-" "-" "-" "$action" "$note" >> "$OUT"
    continue
  fi
  wt="clean"; [ -n "$(git -C "$dir" status --porcelain 2>/dev/null)" ] && wt="dirty"
  remote_ref="origin/$default_branch"
  if ! git -C "$dir" show-ref --verify --quiet "refs/remotes/$remote_ref"; then
    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$repo" "$default_branch" "$current" "$wt" "-" "-" "-" "none" "remote_branch_unavailable" >> "$OUT"
    continue
  fi
  counts=$(git -C "$dir" rev-list --left-right --count "HEAD...$remote_ref")
  ahead=$(printf '%s' "$counts" | awk '{print $1}')
  behind=$(printf '%s' "$counts" | awk '{print $2}')
  remote_head=$(git -C "$dir" rev-parse "$remote_ref")
  action="already_synced"; note="default_branch_synced"
  if [ "$behind" -gt 0 ] && [ "$ahead" -eq 0 ] && [ "$wt" = "clean" ]; then
    if git -C "$dir" merge --ff-only "$remote_ref" >/dev/null 2>&1; then action="fast_forward"; note="default_branch_synced"; ahead=0; behind=0; else action="blocked"; note="fast_forward_failed"; fi
  elif [ "$ahead" -gt 0 ] || [ "$behind" -gt 0 ]; then
    action="none"; note="divergent_or_dirty_requires_review"
  fi
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$repo" "$default_branch" "$current" "$wt" "$behind" "$ahead" "$remote_head" "$action" "$note" >> "$OUT"
done < "$META"
awk -F '\t' 'NR>1 && ($4!="clean" || $8=="blocked" || $8=="none" || $8=="review_branch_dirty") {bad++} END{exit bad?1:0}' "$OUT"
