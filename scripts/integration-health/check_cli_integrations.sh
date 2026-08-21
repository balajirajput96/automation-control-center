#!/usr/bin/env bash
set -u

# Secret-safe integration health report.
# This script intentionally never prints token values, environment values, or credential-file contents.

output_file="${1:-integration-health.tsv}"
mkdir -p "$(dirname "$output_file")" 2>/dev/null || true
printf 'checked_at_utc\tcli\tinstalled\tversion\tauth_state\tcredential_store_present\tnotes\n' > "$output_file"

now_utc() { date -u +%Y-%m-%dT%H:%M:%SZ; }

record() {
  local cli="$1" installed="$2" version="$3" auth="$4" store="$5" notes="$6"
  version=${version//$'\t'/ }
  notes=${notes//$'\t'/ }
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$(now_utc)" "$cli" "$installed" "${version:-unknown}" "$auth" "$store" "$notes" >> "$output_file"
}

check_gh() {
  if ! command -v gh >/dev/null 2>&1; then
    record gh no unavailable unavailable no 'GitHub CLI is not installed'
    return
  fi
  local version auth_output auth_rc
  version=$(gh --version 2>/dev/null | head -1 || true)
  auth_output=$(gh auth status 2>&1)
  auth_rc=$?
  if [ "$auth_rc" -eq 0 ]; then
    record gh yes "$version" authenticated yes 'Official GitHub CLI auth status succeeded; credential values omitted'
  else
    record gh yes "$version" unauthenticated yes 'Official GitHub CLI is installed; interactive authorization may be required'
  fi
}

check_jules() {
  if ! command -v jules >/dev/null 2>&1; then
    record jules no unavailable unavailable no 'Jules CLI is not installed'
    return
  fi
  local help_output version_hint store
  help_output=$(jules --help 2>&1 | head -5 || true)
  version_hint=$(printf '%s' "$help_output" | grep -Eio 'v?[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)
  store=no
  [ -d "${HOME:-}/.jules" ] && store=yes
  record jules yes "${version_hint:-installed}" deferred "$store" 'Login was not attempted; OAuth state must be established through the official user flow'
}

check_optional() {
  local cli="$1" config_dir="$2"
  if ! command -v "$cli" >/dev/null 2>&1; then
    record "$cli" no unavailable unavailable no "${cli} CLI is not installed in this environment"
    return
  fi
  local version store
  version=$("$cli" --version 2>&1 | head -1 || true)
  store=no
  [ -d "$config_dir" ] && store=yes
  record "$cli" yes "$version" unverified "$store" 'No login or credential inspection was attempted'
}

check_gh
check_jules
check_optional agy "${HOME:-}/.config/antigravity"
check_optional gemini "${HOME:-}/.gemini"

# Keep the shell pipeline successful only when the report was written.
[ -s "$output_file" ]
