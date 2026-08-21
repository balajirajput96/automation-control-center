#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/recover_repositories.sh"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

bash -n "$RUNNER" "$0"

set +e
RECOVERY_ROOT="$work/recovery" "$RUNNER" --plan >"$work/plan-output.txt" 2>"$work/plan-error.txt"
plan_rc=$?
RECOVERY_ROOT="$work/recovery" "$RUNNER" --apply >"$work/apply-output.txt" 2>"$work/apply-error.txt"
apply_rc=$?
set -e

test "$plan_rc" -eq 2
plan_file="$(cat "$work/plan-output.txt")"
grep -q 'metadata_missing' "$plan_file"
test "$apply_rc" -eq 2
grep -q 'refusing recovery apply' "$work/apply-error.txt"
test ! -e "$work/recovery/repos"

echo "repository-recovery checks passed"
