#!/usr/bin/env bash
set -u -o pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ROOT="${ROOT:-${WORKSPACE_ROOT:-$PROJECT_ROOT/.workspace}}"
REPOS="${REPOS:-${WORKSPACE_REPOS:-$ROOT/repos}}"
META="${META:-${WORKSPACE_META:-$SCRIPT_DIR/original_repo_metadata.tsv}}"
OUT="${1:-$ROOT/checkpoints/repo_checks_cycle.tsv}"
LOGDIR="${LOGDIR:-$ROOT/checkpoints/repo_check_logs}"
mkdir -p "$LOGDIR" "$(dirname "$OUT")"
printf 'repo\tjson\tmerge_markers\tpython_compile\tsecret_scan\tresult\n' > "$OUT"

json_check() {
  local dir="$1" log="$2" f rc=0
  : > "$log"
  while IFS= read -r -d '' f; do
    case "$(basename "$f")" in
      tsconfig*.json) continue ;;
    esac
    if ! jq -e . "$f" >/dev/null 2>>"$log"; then
      printf '%s\n' "$f" >> "$log"
      rc=1
    fi
  done < <(find "$dir" \( -path '*/.git' -o -path '*/node_modules' -o -path '*/.next' -o -path '*/dist' -o -path '*/build' \) -prune -o -type f -name '*.json' -print0)
  printf '%s' "$rc"
}

marker_check() {
  local dir="$1" log="$2"
  : > "$log"
  local f found=0
  while IFS= read -r -d '' f; do
    if grep -qE '^<<<<<<<' "$f" 2>/dev/null && grep -qE '^>>>>>>>' "$f" 2>/dev/null; then
      printf '%s\n' "$f" >> "$log"
      found=1
    fi
  done < <(find "$dir" \( -path '*/.git' -o -path '*/node_modules' -o -path '*/.next' -o -path '*/dist' -o -path '*/build' \) -prune -o -type f -print0)
  printf '%s' "$found"
}

python_check() {
  local dir="$1" log="$2" f rc=0
  : > "$log"
  while IFS= read -r -d '' f; do
    if ! python3 -m py_compile "$f" >>"$log" 2>&1; then
      printf '%s\n' "$f" >> "$log"
      rc=1
    fi
  done < <(find "$dir" \( -path '*/.git' -o -path '*/node_modules' -o -path '*/.venv' -o -path '*/venv' -o -path '*/__pycache__' \) -prune -o -type f -name '*.py' -print0)
  printf '%s' "$rc"
}

secret_check() {
  local dir="$1" log="$2"
  if grep -RIlE --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude='*.lock' '(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY-----)' "$dir" > "$log" 2>/dev/null; then
    printf '1'
  else
    : > "$log"
    printf '0'
  fi
}

failures=0
while IFS=$'\t' read -r repo default_branch _rest; do
  [ "$repo" = "repo" ] && continue
  [ -n "$repo" ] || continue
  name="${repo#*/}"
  dir="$REPOS/$name"
  json=missing; markers=missing; py=missing; secret=missing; result=missing
  if [ -d "$dir" ]; then
    json=$(json_check "$dir" "$LOGDIR/${name}_json.log")
    markers=$(marker_check "$dir" "$LOGDIR/${name}_markers.log")
    py=$(python_check "$dir" "$LOGDIR/${name}_python.log")
    secret=$(secret_check "$dir" "$LOGDIR/${name}_secrets.log")
    if [ "$json" = 0 ] && [ "$markers" = 0 ] && [ "$py" = 0 ] && [ "$secret" = 0 ]; then result=pass; else result=fail; fi
  fi
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$name" "$json" "$markers" "$py" "$secret" "$result" >> "$OUT"
  [ "$result" = pass ] || failures=$((failures + 1))
done < "$META"

find "$REPOS" -type f -name '*.pyc' -delete 2>/dev/null || true
find "$REPOS" -type d -name __pycache__ -empty -delete 2>/dev/null || true
printf 'output=%s\n' "$OUT"
printf 'repositories=%s\n' "$(awk -F '\t' 'NR>1{n++} END{print n+0}' "$OUT")"
printf 'failures=%s\n' "$failures"
[ "$failures" -eq 0 ]
