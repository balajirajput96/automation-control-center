#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/workspace_common.sh"
TARGET_REPOSITORY="${TARGET_REPOSITORY:-balajirajput96/automation-control-center}"
OUTPUT_DIR="$(workspace_output_dir)"
OUT="${1:-$OUTPUT_DIR/current_project_integrations.tsv}"
mkdir -p "$(dirname "$OUT")"
printf 'area\tstatus\tdetail\n' > "$OUT"
record() { printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$OUT"; }

if identity="$(gh api user --jq '.login' 2>"$OUTPUT_DIR/github_identity.err")"; then
  record github-auth pass "authenticated_user=$identity"
else
  record github-auth warn "$(sanitize_metadata < "$OUTPUT_DIR/github_identity.err")"
fi
if gh repo view "$TARGET_REPOSITORY" --json nameWithOwner,defaultBranchRef,url --jq '.nameWithOwner + " branch=" + .defaultBranchRef.name' >"$OUTPUT_DIR/github_repository.txt" 2>"$OUTPUT_DIR/github_repository.err"; then
  record github-repo pass "$(cat "$OUTPUT_DIR/github_repository.txt")"
else
  record github-repo warn "$(sanitize_metadata < "$OUTPUT_DIR/github_repository.err")"
fi

if command -v jules >/dev/null 2>&1 && jules remote list --repo >/dev/null 2>"$OUTPUT_DIR/jules.err"; then record jules pass 'repository listing succeeded'; else record jules deferred 'CLI unavailable or provider session requires interactive login'; fi
if command -v agy >/dev/null 2>&1 && agy models >/dev/null 2>"$OUTPUT_DIR/antigravity.err"; then record antigravity pass 'model discovery succeeded'; else record antigravity deferred 'CLI unavailable or provider session requires interactive login'; fi
if command -v gemini >/dev/null 2>&1 && GEMINI_CLI_AUTH_TYPE=gemini-api-key GEMINI_CLI_TRUST_WORKSPACE=true gemini -p 'Reply with exactly ready.' --output-format text >/dev/null 2>"$OUTPUT_DIR/gemini.err"; then record gemini pass 'managed API-key readiness succeeded'; else record gemini deferred 'CLI unavailable or managed credential is unavailable'; fi
if command -v datadog >/dev/null 2>&1 || command -v ddog >/dev/null 2>&1; then record datadog available 'Datadog-specific CLI present'; else record datadog not-configured 'no Datadog-specific CLI or repository integration detected'; fi

printf '%s\n' "$OUT"
