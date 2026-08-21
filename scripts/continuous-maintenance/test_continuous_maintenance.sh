#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

bash -n "$SCRIPT_DIR"/*.sh
[ "$(awk 'END{print NR-1}' "$SCRIPT_DIR/original_repo_metadata.tsv")" -eq 32 ]
! grep -RInE '(^|[ =])/home/ubuntu|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}|BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY' "$SCRIPT_DIR" --include='*.sh'
! grep -RInE '(^|[[:space:]])rm[[:space:]]+-rf([[:space:]]|$)' "$SCRIPT_DIR" --include='*.sh'
for script in audit_rebase_state.sh daily_workspace_maintenance.sh run_exact_tests.sh run_repo_checks_cycle.sh; do
  test -x "$SCRIPT_DIR/$script" || chmod +x "$SCRIPT_DIR/$script"
done
printf 'continuous-maintenance checks passed\n'
