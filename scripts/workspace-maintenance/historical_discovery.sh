#!/usr/bin/env bash
set -u
ROOT=/home/ubuntu/github-workspace
OUT="${1:-$ROOT/checkpoints/historical_discovery_latest.tsv}"
mkdir -p "$(dirname "$OUT")"
{
  printf 'section\tkey\tvalue\n'
  printf 'environment\tpwd\t%s\n' "$PWD"
  printf 'environment\tos\t%s\n' "$(uname -srmo 2>/dev/null || true)"
  printf 'environment\tuptime\t%s\n' "$(uptime -p 2>/dev/null || true)"
  for f in "$HOME/.bash_history" "$HOME/.zsh_history" "$HOME/.local/share/fish/fish_history"; do
    if [ -f "$f" ]; then printf 'history\tfile\t%s\n' "$f"; printf 'history\tlines\t%s\n' "$(wc -l < "$f")"; printf 'history\tmodified\t%s\n' "$(stat -c %y "$f" 2>/dev/null || true)"; fi
  done
  for d in "$ROOT" "$HOME/.config" "$HOME/.local/bin" "$HOME/.gemini" "$HOME/.jules" "$HOME/.antigravity"; do
    if [ -e "$d" ]; then printf 'path\texists\t%s\n' "$d"; printf 'path\tentries\t%s\n' "$(find "$d" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l)"; fi
  done
  if [ -d "$ROOT/repos" ]; then
    printf 'workspace\trepository_count\t%s\n' "$(find "$ROOT/repos" -mindepth 1 -maxdepth 1 -type d | wc -l)"
    printf 'workspace\tcheckpoint_count\t%s\n' "$(find "$ROOT/checkpoints" -maxdepth 1 -type f 2>/dev/null | wc -l)"
    printf 'workspace\tlog_count\t%s\n' "$(find "$ROOT" -type f \( -name '*.log' -o -name '*.tsv' -o -name '*.md' \) -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null | wc -l)"
  fi
  printf 'scripts\tworkspace_scripts\t%s\n' "$(find "$ROOT" -maxdepth 3 -type f \( -name '*.sh' -o -name '*.py' \) -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null | sort | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
  printf 'configs\tworkspace_configs\t%s\n' "$(find "$ROOT" -maxdepth 4 -type f \( -name '*.yml' -o -name '*.yaml' -o -name 'compose.yaml' -o -name 'compose.yml' -o -name '.env.example' -o -name 'environment-template.md' \) -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null | sort | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
  printf 'git\tglobal_identity\t%s\n' "$(git config --global --get-regexp '^user\\.' 2>/dev/null | tr '\n' ';' | sed -E 's/(token|password|secret|key)[^;]*/[REDACTED]/Ig')"
  if [ -d "$ROOT/repos" ]; then
    while IFS= read -r repo; do
      name=$(basename "$repo")
      if git -C "$repo" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        branch=$(git -C "$repo" symbolic-ref --short -q HEAD 2>/dev/null || printf 'DETACHED')
        status=$(git -C "$repo" status --porcelain 2>/dev/null | wc -l)
        remotes=$(git -C "$repo" remote 2>/dev/null | tr '\n' ',' | sed 's/,$//')
        aheadbehind=$(git -C "$repo" rev-list --left-right --count HEAD...@{upstream} 2>/dev/null | tr '\t' ':' || true)
        reflog=$(git -C "$repo" reflog expire --dry-run --all 2>/dev/null | wc -l)
        stashes=$(git -C "$repo" stash list 2>/dev/null | wc -l)
        printf 'repo\t%s\tbranch=%s;dirty=%s;remotes=%s;aheadbehind=%s;reflog_dryrun=%s;stashes=%s\n' "$name" "$branch" "$status" "$remotes" "$aheadbehind" "$reflog" "$stashes"
      fi
    done < <(find "$ROOT/repos" -mindepth 1 -maxdepth 1 -type d | sort)
  fi
  printf 'cron\tdaemon\t%s\n' "$(systemctl is-active cron 2>/dev/null || true)"
  printf 'cron\tworkspace_entries\t%s\n' "$(crontab -l 2>/dev/null | grep -E 'github-workspace|daily_maintenance|CRON_TZ' | tr '\n' ';' | sed -E 's/(TOKEN|KEY|SECRET|PASSWORD|AUTHORIZATION)=[^; ]+ /[REDACTED] /Ig')"
  for cmd in git gh agy jules gemini docker pnpm node python3 pytest; do
    if command -v "$cmd" >/dev/null 2>&1; then printf 'cli\t%s\t%s\n' "$cmd" "$(command -v "$cmd")"; printf 'cli_version\t%s\t%s\n' "$cmd" "$($cmd --version 2>/dev/null | head -n 1 | sed -E 's/(token|key|secret|password)[^[:space:]]*/[REDACTED]/Ig')"; else printf 'cli\t%s\tMISSING\n' "$cmd"; fi
  done
  printf 'docker\tinfo\t%s\n' "$(docker info --format '{{.ServerVersion}}' 2>/dev/null || printf 'UNAVAILABLE')"
} > "$OUT"
printf '%s\n' "$OUT"
exit 0
