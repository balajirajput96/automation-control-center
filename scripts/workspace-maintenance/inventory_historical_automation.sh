#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/workspace_common.sh"
PROJECT_ROOT="${PROJECT_ROOT:-$(workspace_project_root)}"
OUTPUT_DIR="$(workspace_output_dir)"
OUT="${1:-$OUTPUT_DIR/automation_inventory.tsv}"
mkdir -p "$(dirname "$OUT")"

{
  printf 'section\tpath\tclassification\tdetails\n'
  while IFS= read -r file; do
    relative="${file#"$PROJECT_ROOT/"}"
    mode="$(stat -c '%A' "$file")"
    bytes="$(stat -c '%s' "$file")"
    syntax='not-applicable'
    if [[ "$file" == *.sh ]]; then
      if bash -n "$file" >/dev/null 2>&1; then syntax='pass'; else syntax='fail'; fi
    fi
    printf 'maintenance_script\t%s\tmetadata-only\tmode=%s;bytes=%s;syntax=%s\n' "$relative" "$mode" "$bytes" "$syntax"
  done < <(find "$SCRIPT_DIR" -maxdepth 1 -type f -name '*.sh' | sort)

  while IFS= read -r file; do
    relative="${file#"$PROJECT_ROOT/"}"
    if grep -qE '^[[:space:]]*schedule:' "$file"; then classification='scheduled-workflow'; else classification='ci-workflow'; fi
    if grep -qE '(secrets\.|token:|password:|api[_-]?key:)' "$file"; then secret_refs='present'; else secret_refs='none'; fi
    printf 'github_workflow\t%s\t%s\tsecret_refs=%s\n' "$relative" "$classification" "$secret_refs"
  done < <(find "$PROJECT_ROOT/.github/workflows" -type f \( -name '*.yml' -o -name '*.yaml' \) 2>/dev/null | sort)

  while IFS= read -r file; do
    relative="${file#"$PROJECT_ROOT/"}"
    printf 'automation_asset\t%s\ttracked\tbytes=%s\n' "$relative" "$(stat -c '%s' "$file")"
  done < <(find "$PROJECT_ROOT" -type f \( -iname '*automation*' -o -iname '*workflow*' -o -iname '*schedule*' -o -iname '*maintenance*' \) -not -path '*/node_modules/*' -not -path '*/.git/*' | sort)
} > "$OUT"

printf '%s\n' "$OUT"
