#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/workspace_common.sh"
PROJECT_ROOT="${PROJECT_ROOT:-$(workspace_project_root)}"
OUTPUT_DIR="$(workspace_output_dir)"
mkdir -p "$OUTPUT_DIR"
STAMP="$(date -u +%Y%m%d_%H%M%S)"
SUMMARY="$OUTPUT_DIR/daily_latest.tsv"
printf 'step\treturn_code\toutput\n' > "$SUMMARY"
overall_rc=0

run_step() {
  local name="$1"; shift
  local log="$OUTPUT_DIR/${name}_${STAMP}.log"
  set +e
  "$@" >"$log" 2>&1
  local rc=$?
  set -e
  printf '%s\t%s\t%s\n' "$name" "$rc" "$log" >> "$SUMMARY"
  [ "$rc" -eq 0 ] || overall_rc=1
}

run_step discovery "$SCRIPT_DIR/historical_discovery.sh" "$OUTPUT_DIR/historical_discovery_latest.tsv"
run_step inventory "$SCRIPT_DIR/inventory_historical_automation.sh" "$OUTPUT_DIR/automation_inventory.tsv"
run_step workflows "$SCRIPT_DIR/check_workflows.sh" "$OUTPUT_DIR/workflow_status.tsv"
run_step integrations "$SCRIPT_DIR/verify_current_project_integrations.sh" "$OUTPUT_DIR/current_project_integrations.tsv"
run_step contracts bash -lc "cd '$PROJECT_ROOT' && python scripts/validate_n8n_template.py && python scripts/test_record_automation_run.py && python scripts/test_record_terminal_history_metadata.py"
run_step source-syntax bash -n "$SCRIPT_DIR"/*.sh

printf 'daily_summary=%s\n' "$SUMMARY"
exit "$overall_rc"
