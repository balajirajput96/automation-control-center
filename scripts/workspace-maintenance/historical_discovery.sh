#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/workspace_common.sh"
PROJECT_ROOT="${PROJECT_ROOT:-$(workspace_project_root)}"
OUTPUT_DIR="$(workspace_output_dir)"
OUT="${1:-$OUTPUT_DIR/historical_discovery_latest.tsv}"
mkdir -p "$(dirname "$OUT")"

{
  printf 'section\tkey\tvalue\n'
  printf 'policy\thistory\tmetadata-only; command content is never read\n'
  printf 'environment\tproject_root\t%s\n' "$PROJECT_ROOT"
  printf 'environment\tos\t%s\n' "$(uname -srmo 2>/dev/null || true)"

  for history in "$HOME/.bash_history" "$HOME/.zsh_history" "$HOME/.local/share/fish/fish_history"; do
    if [ -f "$history" ]; then
      stat -c 'history\tfile\tpath=%n;size=%s;modified=%y' "$history"
    else
      printf 'history\tfile\tpath=%s;exists=false\n' "$history"
    fi
  done

  for directory in "$HOME/.config/gh" "$HOME/.gemini" "$HOME/.local/share/pnpm"; do
    if [ -e "$directory" ]; then
      printf 'config\tdirectory\tpath=%s;exists=true\n' "$directory"
    fi
  done

  if git -C "$PROJECT_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    branch="$(git -C "$PROJECT_ROOT" branch --show-current)"
    dirty="$(git -C "$PROJECT_ROOT" status --porcelain | wc -l | tr -d ' ')"
    upstream="$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || printf 'none')"
    printf 'git\tproject\tbranch=%s;dirty_entries=%s;upstream=%s\n' "$branch" "$dirty" "$upstream"
  fi

  for command in git gh agy jules gemini pnpm node python3; do
    if command -v "$command" >/dev/null 2>&1; then
      printf 'cli\t%s\tpath=%s\n' "$command" "$(command -v "$command")"
    else
      printf 'cli\t%s\tMISSING\n' "$command"
    fi
  done
} > "$OUT"

printf '%s\n' "$OUT"
