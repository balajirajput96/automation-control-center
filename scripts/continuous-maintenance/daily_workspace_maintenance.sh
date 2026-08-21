#!/usr/bin/env bash
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ROOT="${WORKSPACE_ROOT:-${ROOT:-$PROJECT_ROOT/.workspace}}"
REPOS="${WORKSPACE_REPOS:-${REPOS:-$ROOT/repos}}"
CP="${WORKSPACE_CHECKPOINTS:-${CP:-$ROOT/checkpoints}}"
LOGDIR="${WORKSPACE_LOGS:-${LOGDIR:-$CP/daily_logs}}"
mkdir -p "$LOGDIR"
STAMP="$(date -u +%Y%m%d_%H%M%S)"
SUMMARY="${WORKSPACE_SUMMARY:-$CP/daily_latest.tsv}"
RUNLOG="$LOGDIR/$STAMP.log"
mkdir -p "$(dirname "$SUMMARY")"
exec > >(tee -a "$RUNLOG") 2>&1
printf 'step\treturn_code\tlog\n' > "$SUMMARY"
overall_rc=0
run_step() {
  local name="$1"; shift
  local log="$CP/${name}_${STAMP}.log"
  set +e
  "$@" >"$log" 2>&1
  local rc=$?
  set -e
  printf '%s\t%s\t%s\n' "$name" "$rc" "$log" >> "$SUMMARY"
  cat "$log"
  [ "$rc" -eq 0 ] || overall_rc=1
  return 0
}
run_step static-triage env ROOT="$ROOT" REPOS="$REPOS" META="${WORKSPACE_META:-$SCRIPT_DIR/original_repo_metadata.tsv}" LOGDIR="$CP/repo_check_logs" "$SCRIPT_DIR/run_repo_checks_cycle.sh" "$CP/repo_checks_daily.tsv"
run_step project-checks env WORKSPACE_ROOT="$ROOT" WORKSPACE_REPOS="$REPOS" WORKSPACE_LOGS="$CP/project_logs_daily" "$SCRIPT_DIR/run_project_checks_cycle2.sh" "$CP/project_checks_daily.tsv"
run_step exact-tests env ROOT="$ROOT" "$SCRIPT_DIR/run_exact_tests.sh" "$REPOS" "$CP/exact_tests_daily.tsv" "$CP/exact_test_logs_daily"
run_step python-tests bash -lc "cd '$REPOS/daily-research-reels-automation' && pytest -q; a=\$?; cd '$REPOS/pharma-outreach-automation' && pytest -q; b=\$?; exit \$((a||b))"
find "$REPOS" -type f -name '*.pyc' -delete
find "$REPOS" -type d -name __pycache__ -empty -delete
# github-mcp-serve may generate this reset artifact during checks; remove only that known path.
rm -f "$REPOS/github-mcp-serve/pnpm-lock.yaml"
set +e
git_rc=0
for dir in "$REPOS"/*; do
  [ -d "$dir/.git" ] || continue
  if [ -n "$(git -C "$dir" status --porcelain)" ]; then
    printf 'DIRTY %s\n' "${dir##*/}"
    git -C "$dir" status --short
    git_rc=1
  fi
done
set -e
printf 'git-status\t%s\t%s\n' "$git_rc" "$RUNLOG" >> "$SUMMARY"
[ "$git_rc" -eq 0 ] || overall_rc=1
printf 'daily_summary=%s\n' "$SUMMARY"
printf 'daily_log=%s\n' "$RUNLOG"
exit "$overall_rc"
