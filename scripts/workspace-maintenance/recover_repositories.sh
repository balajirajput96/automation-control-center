#!/usr/bin/env bash
set -u
ROOT="${ROOT:-/home/ubuntu/github-workspace}"
REPOS_DIR="$ROOT/repos"
META="$ROOT/checkpoints/rebase_audit_latest.tsv"
RUN_UTC="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$ROOT/checkpoints/recovery_repositories_${RUN_UTC}.tsv"
ORPHANS="$ROOT/checkpoints/pre_recovery_orphans_${RUN_UTC}"
mkdir -p "$REPOS_DIR" "$ORPHANS"
printf 'repo\tdefault_branch\taction\tresult\tnote\n' > "$OUT"

if [ ! -s "$META" ]; then
  printf 'metadata_missing\t\t\tabort\t%s\n' "$META" >> "$OUT"
  exit 2
fi

while IFS=$'\t' read -r repo default_branch current_branch working_tree behind ahead remote_head action note; do
  [ "$repo" = "repo" ] && continue
  [ -n "$repo" ] || continue
  name="${repo#*/}"
  dest="$REPOS_DIR/$name"
  if [ -e "$dest" ] && [ ! -d "$dest/.git" ]; then
    backup="$ORPHANS/$name"
    mv "$dest" "$backup"
    printf '%s\t%s\tbackup_orphan\tpass\t%s\n' "$repo" "$default_branch" "$backup" >> "$OUT"
  fi
  if [ -d "$dest/.git" ]; then
    if git -C "$dest" fetch --prune origin >/dev/null 2>&1 && git -C "$dest" checkout "$default_branch" >/dev/null 2>&1 && git -C "$dest" merge --ff-only "origin/$default_branch" >/dev/null 2>&1; then
      if [ -z "$(git -C "$dest" status --porcelain)" ]; then
        printf '%s\t%s\texisting_sync\tpass\tclean\n' "$repo" "$default_branch" >> "$OUT"
      else
        printf '%s\t%s\texisting_sync\tblocker\tworking_tree_dirty\n' "$repo" "$default_branch" >> "$OUT"
      fi
    else
      printf '%s\t%s\texisting_sync\tblocker\tfetch_or_fast_forward_failed\n' "$repo" "$default_branch" >> "$OUT"
    fi
  else
    if gh repo clone "$repo" "$dest" >/dev/null 2>&1 && git -C "$dest" fetch --prune origin >/dev/null 2>&1 && git -C "$dest" checkout "$default_branch" >/dev/null 2>&1 && git -C "$dest" merge --ff-only "origin/$default_branch" >/dev/null 2>&1 && [ -z "$(git -C "$dest" status --porcelain)" ]; then
      printf '%s\t%s\tclone\tpass\tclean\n' "$repo" "$default_branch" >> "$OUT"
    else
      printf '%s\t%s\tclone\tfailure\tclone_or_sync_failed\n' "$repo" "$default_branch" >> "$OUT"
    fi
  fi
done < "$META"

printf 'output=%s\n' "$OUT"
printf 'orphans=%s\n' "$ORPHANS"
awk -F '\t' 'NR>1{count++; result[$4]++} END{printf "repositories=%d\n",count; for(k in result) printf "%s=%d\n",k,result[k]}' "$OUT"
failures=$(awk -F '\t' 'NR>1 && $4=="failure"{n++} END{print n+0}' "$OUT")
[ "$failures" -eq 0 ]
