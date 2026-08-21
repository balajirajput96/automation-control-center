#!/usr/bin/env bash
set -u -o pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ROOT="${ROOT:-${WORKSPACE_ROOT:-$PROJECT_ROOT/.workspace}}"
REPOS="${1:-${WORKSPACE_REPOS:-$ROOT/repos}}"
OUT="${2:-$ROOT/checkpoints/exact_tests.tsv}"
LOGDIR="${3:-$ROOT/checkpoints/exact_test_logs}"
mkdir -p "$LOGDIR" "$(dirname "$OUT")"
printf 'repo\tstatus\treturn_code\tcommand\tlog\n' > "$OUT"

run_one() {
  local name="$1" command="$2" log="$LOGDIR/$name.log" rc
  : > "$log"
  timeout --kill-after=20s 900 bash -c "cd '$REPOS/$name' && pnpm test" >"$log" 2>&1
  rc=$?
  if [ "$rc" -eq 0 ]; then
    printf '%s\tpass\t0\t%s\t%s\n' "$name" "$command" "$log" >> "$OUT"
  else
    printf '%s\tfail\t%s\t%s\t%s\n' "$name" "$rc" "$command" "$log" >> "$OUT"
  fi
}

while IFS=$'\t' read -r name command; do
  [ -n "$name" ] || continue
  if [ "$name" = "repo" ] || [[ "$name" == \#* ]]; then continue; fi
  if [ ! -d "$REPOS/$name" ]; then
    printf '%s\tmissing\t127\t%s\t%s\n' "$name" "$command" "$LOGDIR/$name.log" >> "$OUT"
    continue
  fi
  run_one "$name" "$command"
done <<'MANIFEST'
ai-agent-hub	vitest run
ai-automation-platform	vitest run
antigravity-pharma-dashboard	vitest run
automation-control-center-app	vitest run
autonomous-ai-workspace	vitest run
bulk-resume-sender	vitest run
career-monitoring-hub	vitest run
chatbot	canonical package test script (pnpm test)
github-cockpit	vitest run
github-dashboard	vitest run
github-mcp-server-	canonical package test script (pnpm test)
gmail-resume-mailer	vitest run
job-automation-orchestrator	vitest run
neuro-pulse-content-studio	vitest run
orbit-console	vitest run
pharma-qa-job-tracker	vitest run
sellbuilding-ai-agent	vitest run
MANIFEST

failures=$(awk -F '\t' 'NR>1 && $2!="pass" {n++} END{print n+0}' "$OUT")
printf 'output=%s\n' "$OUT"
printf 'tests=%s\n' "$(awk -F '\t' 'NR>1{n++} END{print n+0}' "$OUT")"
printf 'failures=%s\n' "$failures"
[ "$failures" -eq 0 ]
