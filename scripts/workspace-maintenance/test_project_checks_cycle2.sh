#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/project_checks_cycle2.sh"
TMP_DIR="$(mktemp -d)"
trap 'rm -R -- "$TMP_DIR"' EXIT

REPOS="$TMP_DIR/repos"
OUTPUT="$TMP_DIR/output/results.tsv"
LOGS="$TMP_DIR/output/logs"
mkdir -p "$REPOS/fixture-project/.git" "$REPOS/fixture-project/node_modules" "$TMP_DIR/bin"
cat > "$TMP_DIR/bin/pnpm" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case "${1:-}" in
  test) printf '%s\n' 'fixture test'; exit 0 ;;
  run) [ "${2:-}" = "build" ] && { printf '%s\n' 'fixture build'; exit 0; } ;;
  *) exit 1 ;;
esac
SH
chmod +x "$TMP_DIR/bin/pnpm"
cat > "$REPOS/fixture-project/package.json" <<'JSON'
{
  "name": "fixture-project",
  "private": true,
  "scripts": {
    "test": "node -e \"process.exit(0)\"",
    "build": "node -e \"process.exit(0)\""
  }
}
JSON

PATH="$TMP_DIR/bin:$PATH" \
WORKSPACE_ROOT="$TMP_DIR/root" \
WORKSPACE_REPOS="$REPOS" \
WORKSPACE_OUTPUT="$OUTPUT" \
WORKSPACE_LOGS="$LOGS" \
bash "$RUNNER" >/dev/null

expected=$'repo\tinstall\ttypecheck\ttest\tbuild\tresult\nfixture-project\tcached\tna\t0\t0\tpass'
actual="$(cat "$OUTPUT")"
test "$actual" = "$expected"
test -s "$LOGS/fixture-project_test.log"
test -s "$LOGS/fixture-project_build.log"
printf '%s\n' 'project-checks cycle2 regression test passed'
