#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

bash -n "$SCRIPT_DIR"/*.sh
! grep -RInE '(rm -rf|github-workspace|balajirajput96/B|command[[:space:]]+-v[[:space:]]+dd([[:space:];]|$))' "$SCRIPT_DIR" --exclude=test_workspace_maintenance.sh
! grep -RInE '((cat|grep|sed|awk|wc)[^[:space:]]*[[:space:]]+[^[:space:]]*\.bash_history|\.bash_history[^[:space:]]*(cat|grep|sed|awk|wc))' "$PROJECT_ROOT/.github" "$PROJECT_ROOT/docs" "$PROJECT_ROOT/scripts" --exclude=record_terminal_history_metadata.py --exclude=test_record_terminal_history_metadata.py --exclude=test_workspace_maintenance.sh
echo "workspace-maintenance checks passed"
